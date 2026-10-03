import * as turf from '@turf/turf'

const R = 6371000

const toLocalMeters = (points, refLat) => {
  const rad = (refLat * Math.PI) / 180
  return points.map(([lat, lng]) => [
    (lng * Math.PI / 180) * R * Math.cos(rad),
    -(lat * Math.PI / 180) * R, // negativo: el norte queda arriba, igual que en el mapa satelital
  ])
}

// Proyecta el lote y sus zonas excluidas a metros locales, SIEMPRE con la
// misma orientación del mapa real (norte arriba, este a la derecha). Esta
// forma nunca rota — elegir surcos horizontales o verticales solo cambia
// cómo se calculan los surcos por dentro, no cómo se ve el lote.
export const projectPlotSpace = (points, exclusionZones = []) => {
  if (points.length < 3) {
    return { canonicalWidth: 0, canonicalHeight: 0, lotPolygon: [], exclusionPolygons: [] }
  }

  const refLat = points.reduce((sum, [lat]) => sum + lat, 0) / points.length
  const lotLocal = toLocalMeters(points, refLat)

  const xs = lotLocal.map((p) => p[0])
  const ys = lotLocal.map((p) => p[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  const shift = ([x, y]) => [x - minX, y - minY]
  const lotPolygon = lotLocal.map(shift)

  const exclusionPolygons = exclusionZones
    .filter((zone) => zone.length >= 3)
    .map((zone) => toLocalMeters(zone, refLat).map(shift))

  return {
    canonicalWidth: maxX - minX,   // este-oeste
    canonicalHeight: maxY - minY,  // norte-sur
    lotPolygon,
    exclusionPolygons,
  }
}

const closeRing = (ring) => {
  if (!ring.length) return ring
  const [fx, fy] = ring[0]
  const [lx, ly] = ring[ring.length - 1]
  return fx !== lx || fy !== ly ? [...ring, ring[0]] : ring
}

const subtractPolygon = (base, hole) => {
  try {
    return turf.difference(turf.featureCollection([base, hole])) || base
  } catch {
    try {
      return turf.difference(base, hole) || base
    } catch {
      return base
    }
  }
}

const buildPlantableArea = (lotPolygon, exclusionPolygons) => {
  if (!lotPolygon || lotPolygon.length < 3) return null
  let plantable
  try {
    plantable = turf.polygon([closeRing(lotPolygon)])
  } catch {
    return null
  }
  for (const zone of exclusionPolygons || []) {
    if (!zone || zone.length < 3) continue
    try {
      const hole = turf.polygon([closeRing(zone)])
      const result = subtractPolygon(plantable, hole)
      if (result) plantable = result
    } catch {
      // zona con forma inválida — se ignora y se sigue con el resto
    }
  }
  return plantable
}

const MAX_CANDIDATES_PER_ROW = 4000

// Simula colocar surcos sobre la forma real del lote (siempre en su
// orientación canónica, la del mapa). `orientation` decide si los surcos
// corren este-oeste ("horizontal") o norte-sur ("vertical") — nunca rota
// el lote, solo cambia la dirección de las líneas dentro de él.
export const computeRowLayout = ({
  canonicalWidth,
  canonicalHeight,
  orientation = 'horizontal',
  rowsPerGroup = 1,
  intraGroupSpacing = 1,
  interGroupSpacing = 1,
  plantSpacing = 0.3,
  lotPolygon = null,
  exclusionPolygons = [],
}) => {
  const isHorizontal = orientation === 'horizontal'
  const length = isHorizontal ? canonicalWidth : canonicalHeight   // a lo largo de cada surco
  const crossSpan = isHorizontal ? canonicalHeight : canonicalWidth // dirección en la que se apilan los surcos

  if (length <= 0 || crossSpan <= 0 || plantSpacing <= 0) {
    return { totalRows: 0, plantsPerRow: 0, totalPlants: 0, rowSegments: [] }
  }

  const offsets = []
  let offset = 0
  let countInGroup = 0
  let safety = 0
  while (offset <= crossSpan && safety < 5000) {
    offsets.push(offset)
    countInGroup += 1
    if (countInGroup >= rowsPerGroup) {
      offset += interGroupSpacing
      countInGroup = 0
    } else {
      offset += intraGroupSpacing
    }
    safety += 1
  }

  const candidatesPerRow = Math.floor(length / plantSpacing) + 1
  const canCheckExact = lotPolygon && lotPolygon.length >= 3 && candidatesPerRow <= MAX_CANDIDATES_PER_ROW
  const plantableArea = canCheckExact ? buildPlantableArea(lotPolygon, exclusionPolygons) : null

  // Convierte (posición a lo largo del surco, posición entre surcos) a
  // coordenadas del lote real [x,y] — las mismas que usa el polígono.
  const toCanonical = (along, cross) => (isHorizontal ? [along, cross] : [cross, along])

  let totalPlants = 0
  const rowSegments = []

  offsets.forEach((crossOffset) => {
    if (!plantableArea) {
      const count = Math.max(0, candidatesPerRow)
      totalPlants += count
      if (count > 0) {
        const [x1, y1] = toCanonical(0, crossOffset)
        const [x2, y2] = toCanonical(length, crossOffset)
        rowSegments.push({ count, segments: [[x1, y1, x2, y2]] })
      } else {
        rowSegments.push({ count: 0, segments: [] })
      }
      return
    }

    const segments = []
    let runStart = null
    let count = 0
    let pos = 0

    while (pos <= length + 1e-9) {
      const [cx, cy] = toCanonical(pos, crossOffset)
      const inside = turf.booleanPointInPolygon(turf.point([cx, cy]), plantableArea)

      if (inside) {
        count += 1
        if (runStart === null) runStart = pos
      } else if (runStart !== null) {
        const endPos = pos - plantSpacing
        const [sx, sy] = toCanonical(runStart, crossOffset)
        const [ex, ey] = toCanonical(endPos, crossOffset)
        segments.push([sx, sy, ex, ey])
        runStart = null
      }
      pos += plantSpacing
    }
    if (runStart !== null) {
      const endPos = Math.min(length, pos - plantSpacing)
      const [sx, sy] = toCanonical(runStart, crossOffset)
      const [ex, ey] = toCanonical(endPos, crossOffset)
      segments.push([sx, sy, ex, ey])
    }

    totalPlants += count
    rowSegments.push({ count, segments })
  })

  const usableRows = rowSegments.filter((r) => r.count > 0)
  const totalRows = usableRows.length
  const plantsPerRow = totalRows > 0 ? Math.round(totalPlants / totalRows) : 0

  return { totalRows, plantsPerRow, totalPlants, rowSegments }
}