import { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import * as turf from '@turf/turf'
import { Search, LocateFixed, Satellite, Map as MapIcon2 } from 'lucide-react'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

// Ícono personalizado (círculo verde) — evita el bug clásico de los íconos
// rotos de Leaflet en Vite/webpack, que dependen de rutas de imagen.
const pointIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#4ade80;border:2.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.5)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

// Componente interno que escucha cambios de "target" y mueve el mapa hacia allá
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom || 17)
  }, [target, map])
  return null
}

export const calculateAreaM2 = (points) => {
  if (points.length < 3) return 0
  try {
    const closed = [...points, points[0]].map(([lat, lng]) => [lng, lat])
    return turf.area(turf.polygon([closed]))
  } catch {
    return 0
  }
}

// Arma un nombre corto y legible a partir de los datos estructurados de Nominatim,
// en vez del display_name completo (que en zonas rurales de Colombia suele traer
// vereda + corregimiento + departamento + región + país, todo junto).
const buildShortLabel = (result) => {
  const a = result.address || {}
  const place = a.village || a.town || a.city || a.hamlet || a.municipality || a.county || result.name || ''
  const region = a.state || ''
  return [place, region].filter(Boolean).join(', ') || result.display_name
}

export default function PlantingMap({ points, onPointsChange, center = [7.1193, -73.1227], zoom = 15 }) {
  const [layerType, setLayerType] = useState('satellite')
  const [flyTarget, setFlyTarget] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const debounceRef = useRef(null)

  const handleClick = (point) => onPointsChange([...points, point])
  const undo = () => onPointsChange(points.slice(0, -1))
  const reset = () => onPointsChange([])

  const handleDragPoint = (index, latlng) => {
    const updated = [...points]
    updated[index] = [latlng.lat, latlng.lng]
    onPointsChange(updated)
  }

  // Búsqueda de ciudad/departamento con OpenStreetMap Nominatim (gratis, sin API key)
  const handleSearchChange = (value) => {
    setSearchQuery(value)
    clearTimeout(debounceRef.current)
    if (value.trim().length < 3) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&accept-language=es&countrycodes=co&limit=6&q=${encodeURIComponent(value)}`
        )
        const data = await res.json()
        setSearchResults(data)
      } catch {
        toast.error('No se pudo buscar — revisa tu conexión')
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 600)
  }

  const selectSearchResult = (result) => {
    setFlyTarget({ center: [parseFloat(result.lat), parseFloat(result.lon)], zoom: 15 })
    setSearchQuery(buildShortLabel(result))
    setSearchResults([])
  }

  const useCurrentLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTarget({ center: [pos.coords.latitude, pos.coords.longitude], zoom: 17 })
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Permiso de ubicación denegado. Actívalo en la configuración del navegador/sitio.')
        } else if (err.code === err.TIMEOUT) {
          toast.error('Tardó demasiado en obtener tu ubicación. Intenta de nuevo.')
        } else {
          toast.error('No se pudo obtener tu ubicación (revisa que el GPS esté activo).')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [])

  const areaM2 = calculateAreaM2(points)
  const tile = TILE_LAYERS[layerType]

  return (
    <div>
      {/* Buscador + ubicación actual */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <Search size={16} className="text-stone-500 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar ciudad, pueblo o departamento..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#1c1917' }}
            />
            {searching && <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute z-[1000] top-full mt-1 w-full rounded-2xl overflow-hidden shadow-lg"
              style={{ background: 'rgba(30,35,30,0.97)', border: '1px solid rgba(255,255,255,0.15)' }}>
              {searchResults.map((r, i) => (
                <button
                  key={i} type="button" onClick={() => selectSearchResult(r)}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-white/80 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                >
                  {buildShortLabel(r)}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button" onClick={useCurrentLocation} disabled={locating}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white/80 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          {locating
            ? <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
            : <LocateFixed size={15} />}
          {locating ? 'Ubicando...' : 'Mi ubicación'}
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-white/15" style={{ height: '420px' }}>
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} maxNativeZoom={tile.maxZoom} />
          <ClickHandler onMapClick={handleClick} />
          <FlyTo target={flyTarget} />
          {points.map((p, i) => (
            <Marker
              key={i} position={p} icon={pointIcon} draggable
              eventHandlers={{ dragend: (e) => handleDragPoint(i, e.target.getLatLng()) }}
            />
          ))}
          {points.length >= 3 && (
            <Polygon positions={points} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.25 }} />
          )}
        </MapContainer>

        {/* Toggle satelital / calles */}
        <div className="absolute top-3 right-3 z-[1000] flex rounded-full overflow-hidden shadow-lg" style={{ border: '1px solid rgba(255,255,255,0.25)' }}>
          <button
            type="button" onClick={() => setLayerType('satellite')}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={{ background: layerType === 'satellite' ? '#258a4e' : 'rgba(20,28,22,0.85)', color: 'white' }}
          >
            <Satellite size={12} /> Satelital
          </button>
          <button
            type="button" onClick={() => setLayerType('street')}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={{ background: layerType === 'street' ? '#258a4e' : 'rgba(20,28,22,0.85)', color: 'white' }}
          >
            <MapIcon2 size={12} /> Calles
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button" onClick={undo} disabled={points.length === 0}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
          >
            ← Deshacer punto
          </button>
          <button
            type="button" onClick={reset} disabled={points.length === 0}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
          >
            Reiniciar
          </button>
          {points.length > 0 && (
            <span className="text-[11px] text-white/40 font-semibold">{points.length} punto{points.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Área marcada</p>
          <p className="text-sm font-bold text-primary-300">
            {areaM2 > 0
              ? `${areaM2.toLocaleString('es-CO', { maximumFractionDigits: 0 })} m² (${(areaM2 / 10000).toLocaleString('es-CO', { maximumFractionDigits: 3 })} ha)`
              : 'Marca al menos 3 puntos'}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-white/35 mt-2">
        Toca el mapa para marcar las esquinas de tu lote — puedes arrastrar cada punto para ajustarlo. Si el satelital se ve gris ("sin datos"), cambia a "Calles" para seguir haciendo zoom.
      </p>
    </div>
  )
}