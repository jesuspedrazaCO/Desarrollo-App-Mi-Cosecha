// Proyección aproximada de lat/lng a metros locales (equirectangular),
// suficientemente precisa para el tamaño de un lote agrícola (unos cientos de metros).
const R = 6371000

const toLocalMeters = (points) => {
  const avgLat = points.reduce((s, [lat]) => s + lat, 0) / points.length
  const refLat = (avgLat * Math.PI) / 180
  return points.map(([lat, lng]) => [
    (lng * Math.PI / 180) * R * Math.cos(refLat),
    (lat * Math.PI / 180) * R,
  ])
}

// Rectángulo que envuelve el polígono, medido en metros, según la orientación elegida.
// horizontal: los surcos corren izquierda-derecha y se apilan hacia abajo.
// vertical: los surcos corren arriba-abajo y se apilan hacia los lados.
export const computeBoundingDims = (points, orientation) => {
  if (points.length < 3) return { length: 0, width: 0 }
  const local = toLocalMeters(points)
  const xs = local.map((p) => p[0])
  const ys = local.map((p) => p[1])
  const spanX = Math.max(...xs) - Math.min(...xs)
  const spanY = Math.max(...ys) - Math.min(...ys)
  return orientation === 'horizontal'
    ? { length: spanX, width: spanY }
    : { length: spanY, width: spanX }
}

// Simula colocar surcos uno por uno a lo ancho del lote, respetando el patrón
// de grupo (ej: 3 surcos juntos + 1 pasillo ancho, se repite).
export const computeRowLayout = ({
  length,
  width,
  rowsPerGroup = 1,
  intraGroupSpacing = 1,
  interGroupSpacing = 1,
  plantSpacing = 0.3,
}) => {
  if (length <= 0 || width <= 0 || plantSpacing <= 0) {
    return { rows: [], totalRows: 0, plantsPerRow: 0, totalPlants: 0 }
  }

  const rows = []
  let offset = 0
  let countInGroup = 0
  let safety = 0

  while (offset <= width && safety < 5000) {
    rows.push(offset)
    countInGroup += 1
    if (countInGroup >= rowsPerGroup) {
      offset += interGroupSpacing
      countInGroup = 0
    } else {
      offset += intraGroupSpacing
    }
    safety += 1
  }

  const plantsPerRow = Math.max(0, Math.floor(length / plantSpacing) + 1)
  const totalRows = rows.length
  const totalPlants = totalRows * plantsPerRow

  return { rows, totalRows, plantsPerRow, totalPlants }
}