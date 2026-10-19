// Pronóstico por hora desde Open-Meteo (gratis, sin clave, permite llamadas desde el navegador).
// Es un PRONÓSTICO (resolución de ~10 km), no una medición exacta sobre el lote.

export const RAIN_MIN_MM = 0.3
const API = 'https://api.open-meteo.com/v1/forecast'
const HOURLY = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation_probability',
  'precipitation',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
].join(',')

// Convierte la respuesta de la API en una lista simple: un objeto por hora.
export const parseForecast = (json) => {
  const h = json?.hourly
  if (!h?.time?.length) throw new Error('Respuesta sin datos')
  const num = (v, d = 0) => (Number.isFinite(v) ? v : d)
  const hours = h.time.map((time, i) => ({
    time, // "2026-10-18T14:00" (hora local del lote)
    day: time.slice(0, 10),
    hour: Number(time.slice(11, 13)),
    temp: num(h.temperature_2m?.[i]),
    humidity: num(h.relative_humidity_2m?.[i]),
    prob: num(h.precipitation_probability?.[i]),
    rain: num(h.precipitation?.[i]),
    cloud: num(h.cloud_cover?.[i]),
    wind: num(h.wind_speed_10m?.[i]),
    windDir: num(h.wind_direction_10m?.[i]), // de dónde SOPLA el viento
    gust: num(h.wind_gusts_10m?.[i]),
  }))
  // Hora local actual del lote, para saber en qué posición está "ahora".
  const offset = num(json.utc_offset_seconds)
  const nowLocal = new Date(Date.now() + offset * 1000).toISOString().slice(0, 13)
  const found = hours.findIndex((x) => x.time.slice(0, 13) >= nowLocal)
  return { hours, nowIndex: found === -1 ? 0 : found }
}

export const fetchForecast = async (lat, lng, signal) => {
  const url = `${API}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&hourly=${HOURLY}&wind_speed_unit=kmh&forecast_days=7&timezone=auto`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Pronóstico no disponible (${res.status})`)
  return parseForecast(await res.json())
}

export const centroid = (points) => {
  const n = points.length || 1
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n]
}

// "3 pm", "12 am"
export const formatHour = (h) => {
  const x = ((h % 24) + 24) % 24
  const ampm = x < 12 ? 'am' : 'pm'
  const h12 = x % 12 === 0 ? 12 : x % 12
  return `${h12} ${ampm}`
}

export const dayLabel = (day, index) => {
  if (index === 0) return 'Hoy'
  if (index === 1) return 'Mañana'
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
}

export const groupByDay = (hours) => {
  const days = []
  hours.forEach((h, i) => {
    let g = days[days.length - 1]
    if (!g || g.day !== h.day) {
      g = { day: h.day, start: i, end: i, hours: [] }
      days.push(g)
    }
    g.end = i
    g.hours.push(h)
  })
  return days
}

// Dirección del viento (grados desde donde sopla) → nombre de dónde viene.
const POINTS = ['norte', 'nororiente', 'oriente', 'suroriente', 'sur', 'suroccidente', 'occidente', 'noroccidente']
export const windFrom = (deg) => POINTS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]

export const windLabel = (kmh) => {
  if (kmh < 6) return 'calma'
  if (kmh < 20) return 'brisa suave'
  if (kmh < 30) return 'viento moderado'
  if (kmh < 50) return 'viento fuerte'
  return 'viento muy fuerte'
}

export const rainLabel = (mm) => {
  if (mm < 0.1) return 'sin lluvia'
  if (mm < RAIN_MIN_MM) return 'trazas (casi nada)'
  if (mm < 2.5) return 'llovizna / lluvia ligera'
  if (mm < 7.6) return 'lluvia moderada'
  return 'lluvia fuerte'
}

export const dayRainLabel = (mm) => {
  if (mm < 1) return 'sin lluvia importante'
  if (mm < 10) return 'lluvia ligera'
  if (mm < 30) return 'lluvia moderada'
  return 'lluvia fuerte'
}

// Hora con lluvia que se nota: al menos 0.3 mm. Una probabilidad alta con 0.1 mm es casi nada.
const isRainy = (h) => h.rain >= RAIN_MIN_MM

// Tramos seguidos de horas con lluvia probable dentro de un día.
export const rainWindows = (dayHours) => {
  const out = []
  let cur = null
  dayHours.forEach((h) => {
    if (isRainy(h)) {
      if (!cur) cur = { from: h.hour, to: h.hour, mm: 0, maxProb: 0 }
      cur.to = h.hour
      cur.mm += h.rain
      cur.maxProb = Math.max(cur.maxProb, h.prob)
    } else if (cur) {
      out.push(cur)
      cur = null
    }
  })
  if (cur) out.push(cur)
  return out
}

// Mejor tramo (6 am–6 pm) sin lluvia y con poco viento: sirve para fumigar, abonar o sembrar.
export const bestWorkWindow = (dayHours) => {
  let best = null
  let cur = null
  dayHours.forEach((h) => {
    const ok = h.hour >= 6 && h.hour <= 17 && h.rain < 0.1 && h.prob <= 30 && h.wind <= 15 && h.gust <= 30
    if (ok) {
      if (!cur) cur = { from: h.hour, to: h.hour }
      cur.to = h.hour
      if (!best || cur.to - cur.from > best.to - best.from) best = { ...cur }
    } else {
      cur = null
    }
  })
  return best && best.to - best.from >= 1 ? { from: best.from, to: best.to + 1 } : null
}

export const summarizeDay = (dayHours) => {
  const totalMm = dayHours.reduce((s, h) => s + h.rain, 0)
  const maxProb = Math.max(...dayHours.map((h) => h.prob))
  const maxGust = Math.max(...dayHours.map((h) => h.gust))
  const maxTemp = Math.max(...dayHours.map((h) => h.temp))
  const minTemp = Math.min(...dayHours.map((h) => h.temp))
  return {
    totalMm,
    maxProb,
    maxGust,
    maxTemp,
    minTemp,
    windows: rainWindows(dayHours),
    work: bestWorkWindow(dayHours),
  }
}