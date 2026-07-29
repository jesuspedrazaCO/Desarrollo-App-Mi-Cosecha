// Mapa simplificado de códigos de clima de Open-Meteo (estándar WMO) a texto en español
const WEATHER_CODES = {
  0: 'despejado', 1: 'mayormente despejado', 2: 'parcialmente nublado', 3: 'nublado',
  45: 'niebla', 48: 'niebla con escarcha',
  51: 'llovizna ligera', 53: 'llovizna moderada', 55: 'llovizna intensa',
  61: 'lluvia ligera', 63: 'lluvia moderada', 65: 'lluvia intensa',
  80: 'chubascos ligeros', 81: 'chubascos moderados', 82: 'chubascos fuertes',
  95: 'tormenta eléctrica', 96: 'tormenta con granizo', 99: 'tormenta fuerte con granizo',
}

const describeCode = (code) => WEATHER_CODES[code] || 'condiciones variables'

// Devuelve el pronóstico de hoy + 3 días siguientes, o null si no hay ubicación configurada
export const getWeatherForecast = async (lat, lng) => {
  if (lat == null || lng == null) return null

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min,weathercode&timezone=America%2FBogota&forecast_days=4`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    const days = data.daily.time.map((date, i) => ({
      fecha: date,
      probabilidadLluvia: data.daily.precipitation_probability_max[i],
      temperaturaMax: data.daily.temperature_2m_max[i],
      temperaturaMin: data.daily.temperature_2m_min[i],
      condicion: describeCode(data.daily.weathercode[i]),
    }))

    return { dias: days }
  } catch (err) {
    console.error('Error consultando el clima:', err.message)
    return null
  }
}