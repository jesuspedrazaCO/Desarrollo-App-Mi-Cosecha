import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Mountain, RotateCcw, RotateCw, Rotate3d, ChevronsUp, ChevronsDown, Layers, Sprout } from 'lucide-react'
import { DEM_TILES_URL, IMAGERY_TILES_URL, analyzeLot, rowsToGeoJson, surfaceArea, densifyLine, meshPolygon } from '../../utils/terrain'

const EMPTY = { type: 'FeatureCollection', features: [] }

const DEFAULT_PITCH = 68 // más inclinado = se notan mejor los desniveles
const DEFAULT_BEARING = -20
const DEFAULT_EXAGGERATION = 2

const verticesGeoJson = (pts) => ({
  type: 'FeatureCollection',
  features: pts.map(([lat, lng]) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng, lat] } })),
})

// El mapa maneja [lng, lat]; el resto de la página maneja [lat, lng].
const ring = (pts) => {
  const coords = pts.map(([lat, lng]) => [lng, lat])
  return [...coords, coords[0]]
}

// Borde del lote con puntos intermedios para que se pegue al relieve.
const lotGeoJson = (points) =>
  points.length >= 3
    ? { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [densifyLine(ring(points))] } }
    : EMPTY

const zonesGeoJson = (zones) => ({
  type: 'FeatureCollection',
  features: zones
    .filter((z) => z.length >= 3)
    .map((z) => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [densifyLine(ring(z))] } })),
})

// Relleno hecho de celdas pequeñas: así también sigue el terreno y no queda como una lámina plana.
const meshGeoJson = (rings, targetCells) => ({
  type: 'FeatureCollection',
  features: rings
    .filter((r) => r.length >= 3)
    .flatMap((r) => meshPolygon(ring(r), targetCells))
    .map((coordinates) => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates } })),
})

const lotMeshGeoJson = (points) => (points.length >= 3 ? meshGeoJson([points], 1200) : EMPTY)
const zonesMeshGeoJson = (zones) => meshGeoJson(zones, 300)

const extremesGeoJson = (analysis) =>
  analysis
    ? {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { kind: 'alto' }, geometry: { type: 'Point', coordinates: [analysis.high.lng, analysis.high.lat] } },
          { type: 'Feature', properties: { kind: 'bajo' }, geometry: { type: 'Point', coordinates: [analysis.low.lng, analysis.low.lat] } },
        ],
      }
    : EMPTY

const boundsOf = (points) => {
  const b = new maplibregl.LngLatBounds()
  points.forEach(([lat, lng]) => b.extend([lng, lat]))
  return b
}

const fmt = (n, d = 0) => Number(n).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d })

export default function Plot3DView({
  points,
  exclusionZones = [],
  rowSegments = [],
  rowsPerGroup = 1,
  areaM2 = 0,
  demUrl = DEM_TILES_URL,
  imageryUrl = IMAGERY_TILES_URL,
  onSuggestOrientation,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const loadedRef = useRef(false)
  const latestRef = useRef({ points, exclusionZones, analysis: null, rowSegments, rowsPerGroup })
  const [exaggeration, setExaggeration] = useState(DEFAULT_EXAGGERATION)
  const [hillshade, setHillshade] = useState(false)
  const [showRows, setShowRows] = useState(true)
  const [dragMode, setDragMode] = useState('pan') // 'pan' = mover | 'orbit' = girar (solo mouse)
  const [webglError, setWebglError] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'error'

  latestRef.current = { points, exclusionZones, analysis, rowSegments, rowsPerGroup }

  const fitToLot = (animate = true) => {
    const map = mapRef.current
    const pts = latestRef.current.points
    if (!map || pts.length < 3) return
    map.fitBounds(boundsOf(pts), {
      padding: 60,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      maxZoom: 19,
      duration: animate ? 1200 : 0,
    })
  }

  // Crea el mapa una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined
    const coarse = window.matchMedia?.('(pointer: coarse)').matches

    let map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            imagery: {
              type: 'raster',
              tiles: [imageryUrl],
              tileSize: 256,
              maxzoom: 19,
              attribution: 'Imagen &copy; Esri · Relieve: Mapzen / AWS Terrain Tiles',
            },
            dem: {
              type: 'raster-dem',
              tiles: [demUrl],
              tileSize: 256,
              maxzoom: 14,
              encoding: 'terrarium',
            },
            // MapLibre recomienda una fuente aparte para las sombras (misma URL, se cachea igual).
            'dem-shade': {
              type: 'raster-dem',
              tiles: [demUrl],
              tileSize: 256,
              maxzoom: 14,
              encoding: 'terrarium',
            },
          },
          layers: [
            { id: 'imagery', type: 'raster', source: 'imagery' },
            {
              id: 'hillshade',
              type: 'hillshade',
              source: 'dem-shade',
              layout: { visibility: 'none' },
              paint: { 'hillshade-exaggeration': 0.6, 'hillshade-shadow-color': '#0b1f12' },
            },
          ],
          terrain: { source: 'dem', exaggeration: DEFAULT_EXAGGERATION },
        },
        center: [-73.1227, 7.1193],
        zoom: 15,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        maxPitch: 85,
        cooperativeGestures: !!coarse, // en celular: un dedo mueve la página, dos mueven el mapa
        locale: {
          'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda del mouse para acercar el mapa',
          'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda del mouse para acercar el mapa',
          'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
        },
      })
    } catch {
      setWebglError(true)
      return undefined
    }

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.on('load', () => {
      map.addSource('lot', { type: 'geojson', data: lotGeoJson(latestRef.current.points) })
      map.addSource('lot-mesh', { type: 'geojson', data: lotMeshGeoJson(latestRef.current.points) })
      map.addSource('zones-mesh', { type: 'geojson', data: zonesMeshGeoJson(latestRef.current.exclusionZones) })
      map.addSource('vertices', { type: 'geojson', data: verticesGeoJson(latestRef.current.points) })
      map.addSource('zones', { type: 'geojson', data: zonesGeoJson(latestRef.current.exclusionZones) })
      map.addSource('extremes', { type: 'geojson', data: extremesGeoJson(latestRef.current.analysis) })
      map.addSource('rows', {
        type: 'geojson',
        data: rowsToGeoJson(latestRef.current.points, latestRef.current.rowSegments, latestRef.current.rowsPerGroup),
      })

      map.addLayer({ id: 'lot-fill', type: 'fill', source: 'lot-mesh', paint: { 'fill-color': '#4ade80', 'fill-opacity': 0.22 } })
      map.addLayer({
        id: 'rows-line',
        type: 'line',
        source: 'rows',
        paint: {
          'line-color': ['match', ['get', 'tone'], 0, '#4ade80', '#bbf7d0'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 17, 1.4, 19, 3],
          'line-opacity': 0.95,
        },
      })
      map.addLayer({ id: 'zones-fill', type: 'fill', source: 'zones-mesh', paint: { 'fill-color': '#f87171', 'fill-opacity': 0.35 } })
      map.addLayer({ id: 'zones-line', type: 'line', source: 'zones', paint: { 'line-color': '#f87171', 'line-width': 2, 'line-dasharray': [2, 1] } })
      // Borde blanco debajo del verde: la forma del lote se lee bien sobre cualquier imagen.
      map.addLayer({ id: 'lot-casing', type: 'line', source: 'lot', layout: { 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.9 } })
      map.addLayer({ id: 'lot-line', type: 'line', source: 'lot', layout: { 'line-join': 'round' }, paint: { 'line-color': '#16a34a', 'line-width': 3 } })
      map.addLayer({
        id: 'vertices',
        type: 'circle',
        source: 'vertices',
        paint: {
          'circle-radius': 4.5,
          'circle-color': '#ffffff',
          'circle-stroke-color': '#16a34a',
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'extremes',
        type: 'circle',
        source: 'extremes',
        paint: {
          'circle-radius': 7,
          'circle-color': ['match', ['get', 'kind'], 'alto', '#fb923c', '#38bdf8'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      loadedRef.current = true
      fitToLot(false)
    })

    return () => {
      loadedRef.current = false
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mantiene el dibujo del lote al día si cambian los puntos.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    map.getSource('lot')?.setData(lotGeoJson(points))
    map.getSource('lot-mesh')?.setData(lotMeshGeoJson(points))
    map.getSource('zones-mesh')?.setData(zonesMeshGeoJson(exclusionZones))
    map.getSource('vertices')?.setData(verticesGeoJson(points))
    map.getSource('zones')?.setData(zonesGeoJson(exclusionZones))
  }, [points, exclusionZones])

  // Dibuja los surcos de la simulación sobre el terreno y los actualiza si cambian.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    map.getSource('rows')?.setData(rowsToGeoJson(points, rowSegments, rowsPerGroup))
  }, [points, rowSegments, rowsPerGroup])

  // Calcula alturas y pendiente (con una pequeña espera por si se sigue editando).
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    const timer = setTimeout(async () => {
      try {
        const result = await analyzeLot(points, exclusionZones, { urlTemplate: demUrl })
        if (cancelled) return
        if (!result) {
          setAnalysis(null)
          setStatus('error')
          return
        }
        setAnalysis(result)
        setStatus('ok')
        const map = mapRef.current
        if (map && loadedRef.current) map.getSource('extremes')?.setData(extremesGeoJson(result))
      } catch {
        if (!cancelled) {
          setAnalysis(null)
          setStatus('error')
        }
      }
    }, 600)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [points, exclusionZones, demUrl])

  // Si el análisis llegó antes de que el mapa terminara de cargar, pone los puntos extremos al cargar.
  useEffect(() => {
    const map = mapRef.current
    if (map && loadedRef.current) map.getSource('extremes')?.setData(extremesGeoJson(analysis))
  }, [analysis])

  const isTouch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches

  // Modo "Girar": con el mouse, arrastrar con el botón izquierdo gira (izq/der) e inclina (arriba/abajo).
  // En el celular no hace falta: dos dedos giran e inclinan el mapa.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    if (dragMode !== 'orbit') {
      map.dragPan.enable()
      return undefined
    }
    map.dragPan.disable()
    const el = map.getCanvasContainer()
    let last = null
    const down = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      last = { x: e.clientX, y: e.clientY }
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const move = (e) => {
      if (!last) return
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      last = { x: e.clientX, y: e.clientY }
      map.jumpTo({
        bearing: map.getBearing() - dx * 0.4,
        pitch: Math.max(0, Math.min(85, map.getPitch() - dy * 0.3)),
      })
    }
    const up = () => {
      last = null
      el.style.cursor = ''
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.style.cursor = ''
      map.dragPan.enable()
    }
  }, [dragMode])

  const rotateBy = (deg) => mapRef.current?.easeTo({ bearing: mapRef.current.getBearing() + deg, duration: 350 })
  const tiltBy = (deg) =>
    mapRef.current?.easeTo({ pitch: Math.max(0, Math.min(85, mapRef.current.getPitch() + deg)), duration: 350 })
  const lookFromAbove = () => mapRef.current?.easeTo({ pitch: 0, bearing: 0, duration: 600 })

  const handleRows = () => {
    const next = !showRows
    setShowRows(next)
    const map = mapRef.current
    if (map && loadedRef.current) map.setLayoutProperty('rows-line', 'visibility', next ? 'visible' : 'none')
  }

  const handleExaggeration = (value) => {
    setExaggeration(value)
    mapRef.current?.setTerrain({ source: 'dem', exaggeration: value })
  }

  const handleHillshade = () => {
    const next = !hillshade
    setHillshade(next)
    const map = mapRef.current
    if (map && loadedRef.current) map.setLayoutProperty('hillshade', 'visibility', next ? 'visible' : 'none')
  }

  if (webglError) {
    return (
      <div style={panelStyle}>
        Tu navegador o celular no permite mostrar mapas 3D (WebGL). Prueba con Chrome actualizado.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div ref={containerRef} style={{ width: '100%', height: '440px' }} />

        <div style={controlsStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff' }}>
            <Mountain size={14} />
            <span style={{ whiteSpace: 'nowrap' }}>Relieve ×{fmt(exaggeration, 1)}</span>
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={exaggeration}
              onChange={(e) => handleExaggeration(parseFloat(e.target.value))}
              style={{ width: '90px', accentColor: '#4ade80' }}
              aria-label="Exageración del relieve"
            />
          </label>
          <button type="button" onClick={handleRows} style={{ ...chipStyle, ...(showRows ? chipActiveStyle : null) }}>
            <Sprout size={13} /> Surcos
          </button>
          <button type="button" onClick={handleHillshade} style={{ ...chipStyle, ...(hillshade ? chipActiveStyle : null) }}>
            <Layers size={13} /> Sombras
          </button>
          <button type="button" onClick={() => fitToLot(true)} style={chipStyle}>
            <RotateCcw size={13} /> Reiniciar vista
          </button>
        </div>

        <div style={viewBarStyle}>
          {!isTouch && (
            <button
              type="button"
              onClick={() => setDragMode((m) => (m === 'orbit' ? 'pan' : 'orbit'))}
              style={{ ...chipStyle, ...(dragMode === 'orbit' ? chipActiveStyle : null) }}
              title="Con el mouse: arrastra para girar e inclinar el mapa"
            >
              <Rotate3d size={13} /> {dragMode === 'orbit' ? 'Girando: arrastra' : 'Girar con el mouse'}
            </button>
          )}
          <button type="button" onClick={() => rotateBy(-30)} style={chipStyle} aria-label="Girar a la izquierda">
            <RotateCcw size={13} /> Girar
          </button>
          <button type="button" onClick={() => rotateBy(30)} style={chipStyle} aria-label="Girar a la derecha">
            <RotateCw size={13} /> Girar
          </button>
          <button type="button" onClick={() => tiltBy(10)} style={chipStyle} aria-label="Inclinar más">
            <ChevronsUp size={13} /> Inclinar
          </button>
          <button type="button" onClick={() => tiltBy(-10)} style={chipStyle} aria-label="Inclinar menos">
            <ChevronsDown size={13} /> Enderezar
          </button>
          <button type="button" onClick={lookFromAbove} style={chipStyle}>
            Desde arriba
          </button>
        </div>
      </div>

      <div style={panelStyle}>
        {status === 'loading' && <span style={{ color: 'rgba(255,255,255,0.6)' }}>Calculando alturas del terreno…</span>}

        {status === 'error' && (
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>
            No se pudieron obtener las alturas de este lote (revisa tu conexión). El mapa 3D sí funciona.
          </span>
        )}

        {status === 'ok' && analysis && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <Stat label="Altura más baja" value={`${fmt(analysis.minZ)} m`} dot="#38bdf8" />
              <Stat label="Altura más alta" value={`${fmt(analysis.maxZ)} m`} dot="#fb923c" />
              <Stat label="Desnivel del lote" value={`${fmt(analysis.reliefM, 1)} m`} />
              <Stat label="Pendiente promedio" value={`${fmt(analysis.slopePct, 1)} %`} sub={analysis.category.label} />
              <Stat
                label="El terreno baja hacia"
                value={analysis.downhillName || 'Sin dirección clara'}
              />
              {areaM2 > 0 && analysis.slopePct >= 3 && (
                <Stat
                  label="Área real sobre la pendiente"
                  value={`${fmt(surfaceArea(areaM2, analysis.slopePct) / 10000, 3)} ha`}
                  sub={`+${fmt((surfaceArea(areaM2, analysis.slopePct) / areaM2 - 1) * 100, 1)} % vs. área en mapa`}
                />
              )}
            </div>

            <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{analysis.category.tip}</p>

            {analysis.suggestedOrientation && onSuggestOrientation && (
              <button
                type="button"
                onClick={() => onSuggestOrientation(analysis.suggestedOrientation)}
                style={{ ...chipStyle, marginTop: '10px', padding: '8px 12px', fontSize: '13px' }}
              >
                Usar surcos {analysis.suggestedOrientation === 'horizontal' ? 'horizontales (este–oeste)' : 'verticales (norte–sur)'} — atraviesan la pendiente
              </button>
            )}

            <p style={{ margin: '12px 0 0', fontSize: '11px', lineHeight: 1.5, color: 'rgba(255,255,255,0.45)' }}>
              El total de plantas se calcula con distancias horizontales (lo normal para densidad de siembra); hasta ~10 %
              de pendiente la diferencia con la distancia sobre el suelo es menor a 1 %. Alturas sobre el nivel del mar con datos de ~30 m de resolución: sirven para ver la tendencia general del
              terreno. Diferencias de pocos metros no son confiables; para terrazas, drenajes u obras confirma con GPS o
              topografía. Puntos del mapa: naranja = más alto, azul = más bajo.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, dot }) {
  return (
    <div style={{ minWidth: '120px' }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: 99, background: dot, display: 'inline-block' }} />}
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#86efac' }}>{sub}</div>}
    </div>
  )
}

const panelStyle = {
  padding: '16px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: '14px',
}

const controlsStyle = {
  position: 'absolute',
  left: '10px',
  top: '10px',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  maxWidth: 'calc(100% - 70px)',
  borderRadius: '12px',
  background: 'rgba(10,25,15,0.72)',
  backdropFilter: 'blur(6px)',
  zIndex: 2,
}

const viewBarStyle = {
  position: 'absolute',
  left: '10px',
  bottom: '40px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  padding: '6px 8px',
  maxWidth: 'calc(100% - 20px)',
  borderRadius: '12px',
  background: 'rgba(10,25,15,0.72)',
  backdropFilter: 'blur(6px)',
  zIndex: 2,
}

const chipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  borderRadius: '99px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
}

const chipActiveStyle = {
  background: 'rgba(74,222,128,0.28)',
  border: '1px solid rgba(74,222,128,0.7)',
}