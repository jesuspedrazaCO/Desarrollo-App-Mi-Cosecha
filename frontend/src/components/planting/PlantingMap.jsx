import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from 'react-leaflet'
import * as turf from '@turf/turf'
import 'leaflet/dist/leaflet.css'

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

export const calculateAreaM2 = (points) => {
  if (points.length < 3) return 0
  try {
    const closed = [...points, points[0]].map(([lat, lng]) => [lng, lat]) // turf usa [lng, lat]
    return turf.area(turf.polygon([closed]))
  } catch {
    return 0
  }
}

export default function PlantingMap({ points, onPointsChange, center = [7.1193, -73.1227], zoom = 15 }) {
  const handleClick = (point) => onPointsChange([...points, point])
  const undo = () => onPointsChange(points.slice(0, -1))
  const reset = () => onPointsChange([])

  const areaM2 = calculateAreaM2(points)

  return (
    <div>
      <div className="rounded-2xl overflow-hidden border border-white/15" style={{ height: '420px' }}>
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
            maxZoom={19}
          />
          <ClickHandler onMapClick={handleClick} />
          {points.map((p, i) => (
            <CircleMarker
              key={i}
              center={p}
              radius={5}
              pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 1 }}
            />
          ))}
          {points.length >= 3 && (
            <Polygon positions={points} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.25 }} />
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex gap-2">
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
        Toca el mapa para marcar las esquinas de tu lote (mínimo 3 puntos). Puedes desplazarte y hacer zoom para ubicar tu finca.
      </p>
    </div>
  )
}