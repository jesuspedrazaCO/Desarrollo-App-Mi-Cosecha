import * as turf from '@turf/turf'

// Proyección aproximada de lat/lng a metros locales (equirectangular),
// suficientemente precisa para el tamaño de un lote agrícola (unos cientos de metros).
const R = 6371000

const toLocalMeters = (points, refLat) => {
  const rad = (refLat * Math.PI) / 180
  return points.map(([lat, lng]) => [
    (lng * Math.PI / 180) * R * Math.cos(rad),
    -(lat * Math.PI / 180) * R, // negativo: así el norte queda arriba en la simulación, igual que en el mapa satelital
  ])
}

// Proyecta el lote y sus zonas excluidas (carretera, casa, etc.) a un espacio
// local en metros, orientado según `orientation` y desplazado para que el
// lote arranque en (0,0) — así coincide exactamente con el sistema de
// coordenadas que usan los surcos (0..length a lo largo, 0..width a lo ancho).
// Lote y zonas excluidas comparten la misma latitud de referencia y el mismo
// desplazamiento, para que queden alineados entre sí.
export const projectPlotSpace = (points, exclusionZones = [], orientation = 'horizontal') => {
  if (points.length < 3) {
    return { length: 0, width: 0, lotPolygon: [], exclusionPolygons: [] }
  }

  const refLat = points.reduce((sum, [lat]) => sum + lat, 0) / points.length
  const toAxis = ([x, y]) => (orientation === 'horizontal' ? [x, y] : [y, x])

  const lotLocal = toLocalMeters(points, refLat).map(toAxis)
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
    .map((zone) => toLocalMeters(zone, refLat).map(toAxis).map(shift))

  return {
    length: maxX - minX,
    width: maxY - minY,
    lotPolygon,
    exclusionPolygons,
  }
}

// Se mantiene por compatibilidad, por si algo más en el proyecto todavía lo usa.
export const computeBoundingDims = (points, orientation) => {
  const { length, width } = projectPlotSpace(points, [], orientation)
  return { length, width }
}

const closeRing = (ring) => {
  if (!ring.length) return ring
  const [fx, fy] = ring[0]
  const [lx, ly] = ring[ring.length - 1]
  return fx !== lx || fy !== ly ? [...ring, ring[0]] : ring
}

// Resta una zona excluida del área sembrable. Si turf.difference falla por
// alguna geometría inválida, se ignora esa zona en particular en vez de
// romper todo el cálculo.
const subtractPolygon = (base, hole) => {
  try {
    return turf.difference(turf.featureCollection([base, hole])) || base
  } catch {
    try {
      return turf.difference(base, hole) || base // API de versiones anteriores de turf
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

// Límite de seguridad: si el espaciamiento es muy pequeño frente al tamaño
// del lote, probar cada posición una por una podría congelar el navegador.
// En ese caso extremo, se vuelve al cálculo simple (fila completa) en vez
// de trabarse.
const MAX_CANDIDATES_PER_ROW = 4000

// Simula colocar surcos uno por uno a lo ancho del lote, respetando el patrón
// de grupo (ej: 3 surcos juntos + 1 pasillo ancho, se repite), y cuenta solo
// las plantas que caen dentro de la forma real del lote (menos las zonas
// marcadas como no sembrables).
export const computeRowLayout = ({
  length,
  width,
  rowsPerGroup = 1,
  intraGroupSpacing = 1,
  interGroupSpacing = 1,
  plantSpacing = 0.3,
  lotPolygon = null,
  exclusionPolygons = [],
}) => {
  if (length <= 0 || width <= 0 || plantSpacing <= 0) {
    return { rows: [], totalRows: 0, plantsPerRow: 0, totalPlants: 0, rowDetails: [] }
  }

  const offsets = []
  let offset = 0
  let countInGroup = 0
  let safety = 0
  while (offset <= width && safety < 5000) {
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

  const rowDetails = offsets.map((crossOffset) => {
    if (!plantableArea) {
      const count = Math.max(0, candidatesPerRow)
      return { offset: crossOffset, count, segments: count > 0 ? [[0, length]] : [] }
    }

    const segments = []
    let runStart = null
    let count = 0
    let pos = 0

    while (pos <= length + 1e-9) {
      const point = turf.point([pos, crossOffset])
      const inside = turf.booleanPointInPolygon(point, plantableArea)

      if (inside) {
        count += 1
        if (runStart === null) runStart = pos
      } else if (runStart !== null) {
        segments.push([runStart, pos - plantSpacing])
        runStart = null
      }
      pos += plantSpacing
    }
    if (runStart !== null) segments.push([runStart, Math.min(length, pos - plantSpacing)])

    return { offset: crossOffset, count, segments }
  })

  const usableRows = rowDetails.filter((r) => r.count > 0)
  const totalRows = usableRows.length
  const totalPlants = rowDetails.reduce((sum, r) => sum + r.count, 0)
  const plantsPerRow = totalRows > 0 ? Math.round(totalPlants / totalRows) : 0

  return { rows: offsets, totalRows, plantsPerRow, totalPlants, rowDetails }
}