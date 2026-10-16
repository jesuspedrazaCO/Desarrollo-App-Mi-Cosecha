// Utilidades de relieve para la vista 3D de la calculadora de siembra.
//
// Las alturas salen de "tiles" de elevación gratuitos en formato Terrarium
// (cada pixel codifica la altura en metros: (R*256 + G + B/256) - 32768).
// Resolución real de los datos: ~30 m (SRTM) en Colombia, así que sirven para ver
// la tendencia general del terreno, no para obras de precisión.
//
// Si algún día esa fuente deja de funcionar, solo hay que cambiar estas dos URLs.
export const DEM_TILES_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
export const IMAGERY_TILES_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const DEM_ZOOM = 14 // ~9 m por pixel; más zoom no agrega detalle real
const TILE_SIZE = 256

// ── Matemática de tiles ──────────────────────────────────────────────────────

// Coordenada global en pixeles (sobre el mundo entero) de un punto lat/lng.
export const toGlobalPixel = (lat, lng, zoom = DEM_ZOOM) => {
  const n = 2 ** zoom
  const latRad = (lat * Math.PI) / 180
  const x = ((lng + 180) / 360) * n * TILE_SIZE
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE_SIZE
  return { x, y }
}

export const decodeTerrarium = (r, g, b) => r * 256 + g + b / 256 - 32768

const tileUrl = (template, z, x, y) =>
  template.replace('{z}', z).replace('{x}', x).replace('{y}', y)

// Descarga un tile y devuelve sus pixeles ({ data, width, height }) o null si no existe.
const loadTilePixels = (url) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height)
        resolve({ data, width, height })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })

// Altura de un pixel global usando los tiles ya cargados (null si falta el tile).
const pixelElevation = (tiles, gx, gy, zoom) => {
  const max = 2 ** zoom * TILE_SIZE
  const px = Math.min(max - 1, Math.max(0, gx))
  const py = Math.min(max - 1, Math.max(0, gy))
  const tx = Math.floor(px / TILE_SIZE)
  const ty = Math.floor(py / TILE_SIZE)
  const tile = tiles.get(`${tx}/${ty}`)
  if (!tile) return null
  const ix = px - tx * TILE_SIZE
  const iy = py - ty * TILE_SIZE
  const i = (iy * tile.width + ix) * 4
  return decodeTerrarium(tile.data[i], tile.data[i + 1], tile.data[i + 2])
}

// Altura en un punto con interpolación bilineal entre los 4 pixeles vecinos.
export const interpolateElevation = (tiles, lat, lng, zoom = DEM_ZOOM) => {
  const { x, y } = toGlobalPixel(lat, lng, zoom)
  const fx = x - 0.5 // el valor de cada pixel está en su centro
  const fy = y - 0.5
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const tx = fx - x0
  const ty = fy - y0
  const z00 = pixelElevation(tiles, x0, y0, zoom)
  const z10 = pixelElevation(tiles, x0 + 1, y0, zoom)
  const z01 = pixelElevation(tiles, x0, y0 + 1, zoom)
  const z11 = pixelElevation(tiles, x0 + 1, y0 + 1, zoom)
  if ([z00, z10, z01, z11].some((v) => v === null)) return null
  return (
    z00 * (1 - tx) * (1 - ty) + z10 * tx * (1 - ty) + z01 * (1 - tx) * ty + z11 * tx * ty
  )
}

// Carga los tiles que hagan falta y devuelve la altura de cada punto [lat, lng].
export const sampleElevations = async (latlngs, { urlTemplate = DEM_TILES_URL, zoom = DEM_ZOOM } = {}) => {
  const keys = new Set()
  latlngs.forEach(([lat, lng]) => {
    const { x, y } = toGlobalPixel(lat, lng, zoom)
    for (const dx of [-1, 0, 1, 2]) {
      for (const dy of [-1, 0, 1, 2]) {
        keys.add(`${Math.floor((x + dx) / TILE_SIZE)}/${Math.floor((y + dy) / TILE_SIZE)}`)
      }
    }
  })

  const tiles = new Map()
  await Promise.all(
    [...keys].map(async (key) => {
      const [tx, ty] = key.split('/').map(Number)
      const pixels = await loadTilePixels(tileUrl(urlTemplate, zoom, tx, ty))
      if (pixels) tiles.set(key, pixels)
    })
  )

  return latlngs.map(([lat, lng]) => interpolateElevation(tiles, lat, lng, zoom))
}

// ── Geometría del lote ───────────────────────────────────────────────────────

// Punto dentro de polígono (ray casting). Polígono y punto como [lat, lng].
export const pointInPolygon = ([lat, lng], polygon) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i]
    const [latJ, lngJ] = polygon[j]
    const crosses = lngI > lng !== lngJ > lng && lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI
    if (crosses) inside = !inside
  }
  return inside
}

// Puntos de muestra repartidos dentro del lote (sin contar las zonas sin sembrar).
export const buildSampleGrid = (points, exclusionZones = [], targetCount = 500) => {
  const lats = points.map((p) => p[0])
  const lngs = points.map((p) => p[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const refLat = (minLat + maxLat) / 2

  const mPerDegLat = 110540
  const mPerDegLng = 111320 * Math.cos((refLat * Math.PI) / 180)
  const widthM = (maxLng - minLng) * mPerDegLng
  const heightM = (maxLat - minLat) * mPerDegLat

  // El dato real tiene ~9 m por pixel como mínimo; no tiene sentido muestrear más fino.
  const step = Math.max(8, Math.sqrt((widthM * heightM) / targetCount))
  const dLat = step / mPerDegLat
  const dLng = step / mPerDegLng

  const grid = []
  for (let lat = minLat + dLat / 2; lat < maxLat; lat += dLat) {
    for (let lng = minLng + dLng / 2; lng < maxLng; lng += dLng) {
      const p = [lat, lng]
      if (!pointInPolygon(p, points)) continue
      if (exclusionZones.some((zone) => zone.length >= 3 && pointInPolygon(p, zone))) continue
      grid.push(p)
    }
  }
  return { grid, refLat, mPerDegLat, mPerDegLng }
}

// ── Análisis del relieve ─────────────────────────────────────────────────────

const COMPASS = ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste']
export const compassName = (bearing) => COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]

export const slopeCategory = (slopePct) => {
  if (slopePct < 3) return { label: 'Casi plano', tip: 'Terreno prácticamente plano; el agua puede encharcarse si el drenaje es malo.' }
  if (slopePct < 8) return { label: 'Pendiente suave', tip: 'Se trabaja sin problema; conviene que los surcos no bajen en línea recta por la pendiente.' }
  if (slopePct < 15) return { label: 'Pendiente moderada', tip: 'Conviene sembrar los surcos atravesando la pendiente (en curva de nivel) para frenar la erosión.' }
  if (slopePct < 30) return { label: 'Pendiente fuerte', tip: 'Siembra en curva de nivel y considera barreras vivas o terrazas; revisa el drenaje.' }
  return { label: 'Pendiente muy fuerte', tip: 'Terreno muy empinado: pide una revisión en campo antes de sembrar (terrazas, riesgo de erosión).' }
}

// Ajusta un plano z = a + b·este + c·norte por mínimos cuadrados. De ese plano salen
// la pendiente promedio y hacia dónde baja el terreno. Muestras: { x, y, z } en metros.
export const analyzeSamples = (samples) => {
  const valid = samples.filter((s) => s.z !== null && Number.isFinite(s.z))
  if (valid.length < 3) return null

  const n = valid.length
  const mean = (key) => valid.reduce((sum, s) => sum + s[key], 0) / n
  const mx = mean('x')
  const my = mean('y')
  const mz = mean('z')

  let sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0
  valid.forEach((s) => {
    const dx = s.x - mx
    const dy = s.y - my
    const dz = s.z - mz
    sxx += dx * dx
    syy += dy * dy
    sxy += dx * dy
    sxz += dx * dz
    syz += dy * dz
  })

  const det = sxx * syy - sxy * sxy
  let b = 0 // cambio de altura por metro hacia el este
  let c = 0 // cambio de altura por metro hacia el norte
  if (Math.abs(det) > 1e-9) {
    b = (sxz * syy - syz * sxy) / det
    c = (syz * sxx - sxz * sxy) / det
  }

  const gradient = Math.hypot(b, c)
  const slopePct = gradient * 100
  const downhillBearing = gradient > 1e-6 ? ((Math.atan2(-b, -c) * 180) / Math.PI + 360) % 360 : null

  let high = valid[0]
  let low = valid[0]
  valid.forEach((s) => {
    if (s.z > high.z) high = s
    if (s.z < low.z) low = s
  })

  // Si el terreno baja casi de norte a sur, la curva de nivel corre de este a oeste
  // (surcos "horizontales" en el mapa) y al revés.
  let suggestedOrientation = null
  if (downhillBearing !== null && slopePct >= 3) {
    const axis = downhillBearing % 180
    suggestedOrientation = axis < 45 || axis > 135 ? 'horizontal' : 'vertical'
  }

  return {
    count: n,
    minZ: low.z,
    maxZ: high.z,
    meanZ: mz,
    reliefM: high.z - low.z,
    slopePct,
    slopeDeg: (Math.atan(gradient) * 180) / Math.PI,
    downhillBearing,
    downhillName: downhillBearing === null ? null : compassName(downhillBearing),
    category: slopeCategory(slopePct),
    suggestedOrientation,
    high,
    low,
  }
}

// Todo junto: toma el lote ([lat, lng][]), baja las alturas y devuelve el análisis.
export const analyzeLot = async (points, exclusionZones = [], options = {}) => {
  if (points.length < 3) return null
  const { grid, refLat, mPerDegLat, mPerDegLng } = buildSampleGrid(points, exclusionZones)
  if (grid.length < 3) return null

  const elevations = await sampleElevations(grid, options)
  const refLng = points.reduce((sum, p) => sum + p[1], 0) / points.length
  const samples = grid.map(([lat, lng], i) => ({
    lat,
    lng,
    x: (lng - refLng) * mPerDegLng,
    y: (lat - refLat) * mPerDegLat,
    z: elevations[i],
  }))

  const result = analyzeSamples(samples)
  if (result) result.requested = grid.length
  return result
}