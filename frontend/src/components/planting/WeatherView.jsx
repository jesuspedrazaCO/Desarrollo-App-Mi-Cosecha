import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Play, Pause, CloudRain, Wind, Cloud, Thermometer, Clock, AlertTriangle } from 'lucide-react'
import { IMAGERY_TILES_URL } from '../../utils/terrain'
import {
  fetchForecast,
  centroid,
  formatHour,
  dayLabel,
  groupByDay,
  summarizeDay,
  windFrom,
  windLabel,
  dayRainLabel,
  RAIN_MIN_MM,
} from '../../utils/weather'

const EMPTY = { type: 'FeatureCollection', features: [] }
const CLOUD_COUNT = 36
const RAIN_VISIBLE_MM = 0.3 // por debajo de esto (mm por hora) no se dibujan gotas: casi no se nota
const DROP_COUNT = 450
const PLAY_MS = 550 // cada cuánto avanza una hora al darle play

const ring = (pts) => {
  const coords = pts.map(([lat, lng]) => [lng, lat])
  return [...coords, coords[0]]
}
const lotGeoJson = (pts) =>
  pts.length >= 3 ? { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring(pts)] } } : EMPTY

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const rand = (seed) => {
  // Aleatorio repetible (para que las nubes no cambien de forma entre renders).
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// ---------- Cielo animado (nubes, lluvia y flechas de viento) dibujado sobre el mapa ----------
function createSky(canvas, getState, reduceMotion) {
  const ctx = canvas.getContext('2d')
  let w = 0
  let h = 0
  let raf = 0
  let last = 0
  let t = 0
  const clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
    x: rand(i + 1),
    y: rand(i + 50) * 0.8 + 0.05,
    r: 0.04 + rand(i + 100) * 0.06,
    puffs: Array.from({ length: 6 }, (_, k) => ({ dx: (rand(i * 7 + k) - 0.5) * 1.7, dy: (rand(i * 11 + k) - 0.5) * 0.35, s: 0.5 + rand(i * 13 + k) * 0.5 })),
  }))
  const drops = Array.from({ length: DROP_COUNT }, (_, i) => ({ x: rand(i + 300), y: rand(i + 700), l: 10 + rand(i + 900) * 14, s: 0.7 + rand(i + 1100) * 0.6 }))

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.max(1, Math.round(w * dpr))
    canvas.height = Math.max(1, Math.round(h * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const draw = (dt) => {
    const { cloud: cloud0, rain, prob, wind, windDir, near } = getState()
    const cloud = cloud0 * near // al alejarse el mapa, el efecto se desvanece (el pronóstico es de un punto)
    ctx.clearRect(0, 0, w, h)
    if (!w || !h) return
    // El viento viene DE windDir; las nubes van hacia el lado contrario (norte arriba en pantalla).
    const toward = ((windDir + 180) * Math.PI) / 180
    const ux = Math.sin(toward)
    const uy = -Math.cos(toward)
    const drift = (Math.max(wind, 3) * 0.0016) * (reduceMotion ? 0 : 1)

    // Oscurecimiento: más gris cuanta más lluvia/probabilidad haya.
    const wet = clamp(rain / 4 + prob / 250, 0, 1)
    const shade = Math.round(250 - wet * 120)
    const cloudColor = `${shade},${shade},${Math.min(255, shade + 8)}`
    const visible = Math.ceil((cloud / 100) * CLOUD_COUNT)
    const alpha = cloud <= 0 ? 0 : 0.1 + (cloud / 100) * 0.2

    // Velo general: con cielo cubierto el mapa se ve más apagado.
    if (cloud > 0) {
      ctx.fillStyle = `rgba(${Math.round(40 + wet * 10)},${Math.round(55 + wet * 5)},${Math.round(75 + wet * 10)},${(cloud / 100) * 0.1 + wet * 0.08})`
      ctx.fillRect(0, 0, w, h)
    }

    for (let i = 0; i < visible; i++) {
      const c = clouds[i]
      c.x += ux * drift * dt
      c.y += uy * drift * dt * 0.6
      if (c.x > 1.3) c.x = -0.3
      if (c.x < -0.3) c.x = 1.3
      if (c.y > 1.1) c.y = -0.1
      if (c.y < -0.1) c.y = 1.1
      const r = c.r * w
      c.puffs.forEach((p) => {
        const px = (c.x + (p.dx * c.r)) * w
        const py = (c.y + p.dy * c.r * 1.2) * h
        const pr = r * p.s
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr)
        g.addColorStop(0, `rgba(${cloudColor},${alpha})`)
        g.addColorStop(0.55, `rgba(${cloudColor},${alpha * 0.45})`)
        g.addColorStop(1, `rgba(${cloudColor},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, pr, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Lluvia: cantidad de gotas según los mm de esa hora.
    if (rain >= RAIN_VISIBLE_MM && near > 0.05) {
      const intensity = clamp((rain - RAIN_VISIBLE_MM) / 6 + 0.1, 0, 1) * near
      const n = Math.round(Math.max(18, DROP_COUNT * intensity))
      const slant = clamp((ux * wind) / 60, -0.6, 0.6)
      ctx.lineWidth = 1.2
      ctx.strokeStyle = `rgba(190,225,255,${0.35 + intensity * 0.35})`
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const d = drops[i]
        d.y += (reduceMotion ? 0 : 1) * dt * 0.9 * d.s
        d.x += slant * dt * 0.5 * d.s
        if (d.y > 1.05) { d.y = -0.05; d.x = rand(i + t * 3) }
        if (d.x > 1.05) d.x = -0.05
        if (d.x < -0.05) d.x = 1.05
        const x = d.x * w
        const y = d.y * h
        ctx.moveTo(x, y)
        ctx.lineTo(x + slant * d.l, y + d.l)
      }
      ctx.stroke()
    }

    // Flechas de viento (apuntan hacia donde va el viento).
    if (wind >= 6 && near > 0.05) {
      const len = clamp(14 + wind * 1.1, 16, 58)
      const cols = w < 520 ? 3 : 5
      const rows = 3
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * near})`
      ctx.fillStyle = `rgba(255,255,255,${0.7 * near})`
      ctx.shadowColor = 'rgba(0,0,0,0.45)'
      ctx.shadowBlur = 4
      const sway = reduceMotion ? 0 : Math.sin(t * 2) * 4
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = ((c + 0.5 + (r % 2) * 0.3) / (cols + 0.3)) * w
          const cy = ((r + 0.6) / (rows + 0.4)) * h * 0.9 + h * 0.08
          const x0 = cx - ux * len * 0.5 + ux * sway
          const y0 = cy - uy * len * 0.5 + uy * sway
          const x1 = cx + ux * len * 0.5 + ux * sway
          const y1 = cy + uy * len * 0.5 + uy * sway
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
          ctx.stroke()
          const a = Math.atan2(uy, ux)
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x1 - 8 * Math.cos(a - 0.5), y1 - 8 * Math.sin(a - 0.5))
          ctx.lineTo(x1 - 8 * Math.cos(a + 0.5), y1 - 8 * Math.sin(a + 0.5))
          ctx.closePath()
          ctx.fill()
        }
      }
      ctx.shadowBlur = 0
    }
  }

  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0)
    last = now
    t += dt
    draw(dt)
    raf = requestAnimationFrame(loop)
  }

  resize()
  if (reduceMotion) draw(0)
  else raf = requestAnimationFrame(loop)

  return {
    resize: () => { resize(); if (reduceMotion) draw(0) },
    redraw: () => { if (reduceMotion) draw(0) },
    stop: () => cancelAnimationFrame(raf),
  }
}

// ---------- Componente ----------
export default function WeatherView({ points }) {
  const mapBoxRef = useRef(null)
  const canvasRef = useRef(null)
  const skyRef = useRef(null)
  const stateRef = useRef({ cloud: 0, rain: 0, prob: 0, wind: 0, windDir: 0 })
  const nearRef = useRef(1) // 0 = mapa muy lejos (sin efecto), 1 = cerca (efecto completo)
  const [far, setFar] = useState(false)

  const [forecast, setForecast] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'error'
  const [fetchKey, setFetchKey] = useState(0)
  const [loading, setLoading] = useState(false) // true mientras se baja un pronóstico nuevo
  const mapRef = useRef(null)
  const cacheRef = useRef(new Map()) // pronósticos ya bajados, por zona
  const [idxState, setIdx] = useState(null) // null = aún no se eligió hora (se usa la actual)
  const [notice, setNotice] = useState('')
  const hasForecast = useRef(false)
  const [playing, setPlaying] = useState(false)

  const [lotLat, lotLng] = useMemo(() => centroid(points), [points])
  const lotKey = `${lotLat.toFixed(2)},${lotLng.toFixed(2)}`
  // Zona del pronóstico: arranca en el lote y sigue al centro del mapa cuando la persona lo mueve.
  const [spot, setSpot] = useState({ lat: lotLat, lng: lotLng })
  const spotKey = `${(Math.round(spot.lat * 10) / 10).toFixed(2)},${(Math.round(spot.lng * 10) / 10).toFixed(2)}` // celdas de ~11 km, como la resolución del pronóstico
  const awayFromLot = Math.abs(spot.lat - lotLat) > 0.05 || Math.abs(spot.lng - lotLng) > 0.05

  // Si el lote cambia de sitio, el pronóstico vuelve al lote.
  useEffect(() => {
    setSpot({ lat: lotLat, lng: lotLng })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotKey])

  // Descarga del pronóstico de la zona que se está mirando (con memoria para no repetir llamadas).
  useEffect(() => {
    const cached = cacheRef.current.get(spotKey)
    if (cached) {
      hasForecast.current = true
      setNotice('')
      setForecast(cached)
      setIdx((i) => (i === null ? cached.nowIndex : Math.min(i, cached.hours.length - 1)))
      setStatus('ok')
      setLoading(false)
      return undefined
    }
    const ctrl = new AbortController()
    setLoading(true)
    fetchForecast(spot.lat, spot.lng, ctrl.signal)
      .then((f) => {
        cacheRef.current.set(spotKey, f)
        hasForecast.current = true
        setNotice('')
        setForecast(f)
        // Solo la primera vez se pone la hora actual; al cambiar de zona se conserva la hora elegida.
        setIdx((i) => (i === null ? f.nowIndex : Math.min(i, f.hours.length - 1)))
        setStatus('ok')
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoading(false)
        if (hasForecast.current) setNotice('No se pudo actualizar el pronóstico de esta zona.')
        else setStatus('error')
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotKey, fetchKey])

  // Mapa satelital con el lote (sin relieve: aquí lo importante es el cielo).
  useEffect(() => {
    if (!mapBoxRef.current) return undefined
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    let map
    try {
      const b = new maplibregl.LngLatBounds()
      points.forEach(([la, ln]) => b.extend([ln, la]))
      map = new maplibregl.Map({
        container: mapBoxRef.current,
        style: {
          version: 8,
          sources: {
            imagery: { type: 'raster', tiles: [IMAGERY_TILES_URL], tileSize: 256, maxzoom: 19, attribution: 'Imagen &copy; Esri · Pronóstico: Open-Meteo' },
            lot: { type: 'geojson', data: lotGeoJson(points) },
          },
          layers: [
            { id: 'imagery', type: 'raster', source: 'imagery' },
            { id: 'lot-fill', type: 'fill', source: 'lot', paint: { 'fill-color': '#4ade80', 'fill-opacity': 0.2 } },
            { id: 'lot-line', type: 'line', source: 'lot', paint: { 'line-color': '#ffffff', 'line-width': 2.5 } },
          ],
        },
        bounds: b,
        fitBoundsOptions: { padding: 70, maxZoom: 17 },
        pitch: 40,
        bearing: 0,
        maxPitch: 70,
        cooperativeGestures: !!coarse,
        locale: {
          'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda del mouse para acercar el mapa',
          'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda del mouse para acercar el mapa',
          'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
        },
      })
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
      // Cuando la persona mueve el mapa a otra zona, el clima sigue al centro del mapa.
      let timer = 0
      map.on('moveend', () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          const c = map.getCenter()
          setSpot({ lat: c.lat, lng: c.lng })
        }, 700)
      })
      map.on('remove', () => clearTimeout(timer))
      // El cielo animado solo tiene sentido de cerca; de lejos se desvanece y se avisa.
      const updateNear = () => {
        const z = map.getZoom()
        nearRef.current = clamp((z - 9) / 3, 0, 1)
        setFar(z < 10)
        skyRef.current?.redraw()
      }
      map.on('zoom', updateNear)
      updateNear()
    } catch {
      map = null // sin WebGL el cielo igual se dibuja sobre un fondo oscuro
    }
    mapRef.current = map
    return () => {
      map?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotKey])

  // Canvas del cielo.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const sky = createSky(canvas, () => ({ ...stateRef.current, near: nearRef.current }), reduce)
    skyRef.current = sky
    const ro = new ResizeObserver(() => sky.resize())
    ro.observe(canvas)
    return () => {
      ro.disconnect()
      sky.stop()
      skyRef.current = null
    }
  }, [])

  const hours = forecast?.hours
  const idx = hours ? Math.min(idxState ?? forecast.nowIndex, hours.length - 1) : 0
  const cur = hours?.[idx]
  const days = useMemo(() => (hours ? groupByDay(hours) : []), [hours])
  const dayIndex = cur ? Math.max(0, days.findIndex((d) => d.day === cur.day)) : 0
  const day = days[dayIndex]
  const summary = useMemo(() => (day ? summarizeDay(day.hours) : null), [day])

  useEffect(() => {
    if (cur) {
      stateRef.current = { cloud: cur.cloud, rain: cur.rain, prob: cur.prob, wind: cur.wind, windDir: cur.windDir }
      skyRef.current?.redraw()
    }
  }, [cur])

  // Reproducción: avanza una hora cada ratito y se detiene al final.
  useEffect(() => {
    if (!playing || !hours) return undefined
    const id = setInterval(() => {
      setIdx((cur0) => {
        const i = cur0 ?? forecast.nowIndex
        if (i >= hours.length - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, PLAY_MS)
    return () => clearInterval(id)
  }, [playing, hours, forecast])

  const goToDay = (i) => {
    const d = days[i]
    if (!d) return
    const target = i === 0 && forecast ? forecast.nowIndex : d.hours.findIndex((x) => x.hour === 7)
    setIdx(i === 0 && forecast ? target : d.start + Math.max(0, target))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', background: '#0b1f12', border: '1px solid rgba(255,255,255,0.1)' }}>
        {status === 'ok' && (
          <div style={zoneBar}>
            <span>{awayFromLot ? 'Pronóstico de la zona que estás viendo' : 'Pronóstico del lote'} · {spot.lat.toFixed(3)}, {spot.lng.toFixed(3)}</span>
            {awayFromLot && (
              <button
                type="button"
                style={retryBtn}
                onClick={() => {
                  const b = new maplibregl.LngLatBounds()
                  points.forEach(([la, ln]) => b.extend([ln, la]))
                  mapRef.current?.fitBounds(b, { padding: 70, maxZoom: 17, duration: 800 })
                  setSpot({ lat: lotLat, lng: lotLng })
                }}
              >
                Volver al lote
              </button>
            )}
          </div>
        )}
        <div ref={mapBoxRef} style={{ width: '100%', height: 'clamp(320px, 52vh, 500px)' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />

        {cur && (
          <div style={hudStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '14px' }}>
              <Clock size={14} /> {dayLabel(cur.day, dayIndex)} · {formatHour(cur.hour)}
              {idx === forecast.nowIndex && <span style={nowBadge}>ahora</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '12px', marginTop: '4px' }}>
              <span><CloudRain size={12} style={{ verticalAlign: '-2px' }} /> {cur.rain.toFixed(1)} mm · {cur.prob}%{cur.rain < RAIN_MIN_MM && cur.prob >= 50 ? ' (casi nada)' : ''}</span>
              <span><Cloud size={12} style={{ verticalAlign: '-2px' }} /> {Math.round(cur.cloud)}%</span>
              <span><Wind size={12} style={{ verticalAlign: '-2px' }} /> {Math.round(cur.wind)} km/h</span>
              <span><Thermometer size={12} style={{ verticalAlign: '-2px' }} /> {Math.round(cur.temp)}°</span>
            </div>
          </div>
        )}

        {(status === 'loading' || loading) && <div style={overlayMsg}>{forecast ? 'Actualizando pronóstico de esta zona…' : 'Cargando pronóstico…'}</div>}
        {far && status === 'ok' && (
          <div style={{ ...zoneBar, left: 'auto', right: '10px', bottom: '74px', maxWidth: '60%' }}>
            Estás muy lejos: el pronóstico es de un punto. Acércate para ver nubes, lluvia y viento.
          </div>
        )}
        {notice && !loading && <div style={overlayMsg}><AlertTriangle size={16} /> {notice}</div>}
        {status === 'error' && (
          <div style={overlayMsg}>
            <AlertTriangle size={16} /> No se pudo traer el pronóstico (revisa tu conexión).
            <button type="button" style={retryBtn} onClick={() => setFetchKey((k) => k + 1)}>Reintentar</button>
          </div>
        )}
      </div>

      {status === 'ok' && cur && summary && (
        <>
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setPlaying((p) => !p)} style={playBtn} aria-label={playing ? 'Pausar' : 'Reproducir'}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={hours.length - 1}
                value={idx}
                onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)) }}
                aria-label="Hora del pronóstico"
                style={{ flex: 1, minWidth: '160px', accentColor: '#4ade80' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
              {days.map((d, i) => (
                <button key={d.day} type="button" onClick={() => { setPlaying(false); goToDay(i) }} style={i === dayIndex ? dayChipActive : dayChip}>
                  {dayLabel(d.day, i)}
                </button>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Lluvia por hora · {dayLabel(day.day, dayIndex)}
            </div>
            <HourChart hours={day.hours} activeHour={cur.hour} onPick={(i) => { setPlaying(false); setIdx(day.start + i) }} />
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
              <span><i style={{ ...legendDot, background: '#60a5fa' }} /> mm de lluvia</span>
              <span><i style={{ ...legendDot, background: '#fbbf24' }} /> probabilidad (%)</span>
            </div>
          </div>

          <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontWeight: 800 }}>Resumen del día</div>
            <p style={para}>
              {summary.windows.length === 0
                ? summary.maxProb >= 60
                  ? `La probabilidad llega a ${summary.maxProb}%, pero con cantidades mínimas (menos de ${RAIN_MIN_MM} mm por hora): casi no se notaría.`
                  : 'No se espera lluvia importante en el día.'
                : summary.windows
                    .map((w) => `Lluvia probable de ${formatHour(w.from)} a ${formatHour(w.to + 1)} (${w.mm.toFixed(1)} mm, hasta ${w.maxProb}% de probabilidad)`)
                    .join('. ') + '.'}{' '}
              Total del día: <b>{summary.totalMm.toFixed(1)} mm</b> ({dayRainLabel(summary.totalMm)}).
            </p>
            <p style={para}>
              Ahora el viento viene del <b>{windFrom(cur.windDir)}</b> a {Math.round(cur.wind)} km/h ({windLabel(cur.wind)}); ráfagas del día de hasta{' '}
              <b>{Math.round(summary.maxGust)} km/h</b>. Temperatura entre {Math.round(summary.minTemp)}° y {Math.round(summary.maxTemp)}°.
            </p>
            <p style={{ ...para, color: summary.work ? '#86efac' : '#fca5a5' }}>
              {summary.work
                ? `Mejor ventana para fumigar, abonar o sembrar: ${formatHour(summary.work.from)} a ${formatHour(summary.work.to)} (sin lluvia y con poco viento).`
                : 'Hoy no hay una ventana clara sin lluvia y con poco viento para fumigar o abonar; revisa otro día.'}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Es un pronóstico (Open-Meteo, ~10 km de resolución), no una medición sobre tu lote. Úsalo como guía y confirma con el cielo y tu experiencia.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// Gráfico simple: barras de mm de lluvia + línea de probabilidad, 24 horas del día.
function HourChart({ hours, activeHour, onPick }) {
  const W = 480
  const H = 120
  const padL = 26
  const padB = 18
  const padT = 8
  const innerW = W - padL - 6
  const innerH = H - padB - padT
  const maxMm = Math.max(4, ...hours.map((h) => h.rain))
  const step = innerW / Math.max(1, hours.length)
  const barW = Math.max(3, step * 0.62)
  const x = (i) => padL + i * step + step / 2
  const yMm = (v) => padT + innerH - (v / maxMm) * innerH
  const yProb = (v) => padT + innerH - (v / 100) * innerH
  const line = hours.map((h, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yProb(h.prob).toFixed(1)}`).join(' ')
  const ticks = [0, maxMm / 2, maxMm]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Lluvia y probabilidad por hora">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - 6} y1={yMm(t)} y2={yMm(t)} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <text x={padL - 4} y={yMm(t) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.55)">{Number.isInteger(t) ? t : t.toFixed(1)}</text>
        </g>
      ))}
      {hours.map((h, i) => (
        <rect
          key={h.time}
          x={x(i) - barW / 2}
          y={yMm(h.rain)}
          width={barW}
          height={Math.max(0, padT + innerH - yMm(h.rain))}
          rx="1.5"
          fill="#60a5fa"
          opacity={h.hour === activeHour ? 1 : 0.65}
        />
      ))}
      <path d={line} fill="none" stroke="#fbbf24" strokeWidth="1.6" />
      {hours.map((h, i) => (
        <g key={`${h.time}-t`}>
          {h.hour % 3 === 0 && (
            <text x={x(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.55)">{formatHour(h.hour)}</text>
          )}
          <rect x={x(i) - step / 2} y={padT} width={step} height={innerH + padB} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onPick(i)} />
        </g>
      ))}
      {hours.map((h, i) =>
        h.hour === activeHour ? (
          <line key="active" x1={x(i)} x2={x(i)} y1={padT} y2={padT + innerH} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
        ) : null
      )}
    </svg>
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
const para = { margin: 0, lineHeight: 1.5, color: 'rgba(255,255,255,0.88)' }
const hudStyle = {
  position: 'absolute',
  left: '10px',
  top: '10px',
  zIndex: 3,
  maxWidth: 'calc(100% - 70px)',
  padding: '8px 12px',
  borderRadius: '12px',
  background: 'rgba(10,25,15,0.72)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  backdropFilter: 'blur(6px)',
}
const nowBadge = { marginLeft: '6px', padding: '1px 7px', borderRadius: '99px', fontSize: '11px', background: 'rgba(74,222,128,0.3)', border: '1px solid rgba(74,222,128,0.7)' }
const zoneBar = {
  position: 'absolute',
  left: '10px',
  bottom: '34px',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  maxWidth: 'calc(100% - 20px)',
  padding: '6px 10px',
  borderRadius: '10px',
  background: 'rgba(10,25,15,0.72)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: '12px',
}
const overlayMsg = {
  position: 'absolute',
  left: '50%',
  bottom: '74px',
  transform: 'translateX(-50%)',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  borderRadius: '12px',
  background: 'rgba(10,25,15,0.85)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: '#fff',
  fontSize: '13px',
}
const retryBtn = { padding: '4px 10px', borderRadius: '99px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', color: '#fff', background: 'rgba(74,222,128,0.28)', border: '1px solid rgba(74,222,128,0.7)' }
const playBtn = { width: 38, height: 38, borderRadius: 99, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', background: 'rgba(74,222,128,0.28)', border: '1px solid rgba(74,222,128,0.7)' }
const dayChip = { padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }
const dayChipActive = { ...dayChip, background: 'rgba(74,222,128,0.28)', border: '1px solid rgba(74,222,128,0.7)' }
const legendDot = { display: 'inline-block', width: 8, height: 8, borderRadius: 99, marginRight: 5 }