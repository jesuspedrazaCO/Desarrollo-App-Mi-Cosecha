import PlantingPlot from '../models/PlantingPlot.js'
import Crop from '../models/Crop.js'

// Acepta puntos como [lat, lng] (lo que manda el mapa) o como { lat, lng }.
const toLatLng = (p) => (Array.isArray(p) ? { lat: p[0], lng: p[1] } : { lat: p?.lat, lng: p?.lng })

const isValidPoint = (p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))

export const createPlantingPlot = async (req, res, next) => {
  let createdCrop = null
  try {
    const {
      name, cropType, cropKey, crop, createCrop, geometry, points, exclusionZones,
      areaM2, areaHectares, orientation, patternMode, rowSpacing, rowsPerGroup,
      intraGroupSpacing, interGroupSpacing, plantSpacing,
      totalRows, plantsPerRow, estimatedPlants,
    } = req.body

    // El frontend manda "points"; "geometry" se mantiene por compatibilidad.
    const rawPoints = Array.isArray(geometry) ? geometry : Array.isArray(points) ? points : []
    const polygon = rawPoints.map(toLatLng).filter(isValidPoint)

    if (polygon.length < 3) {
      return res.status(400).json({ success: false, message: 'El lote necesita al menos 3 puntos' })
    }

    const zones = (Array.isArray(exclusionZones) ? exclusionZones : [])
      .map((zone) => ({
        points: (Array.isArray(zone) ? zone : zone?.points || []).map(toLatLng).filter(isValidPoint),
      }))
      .filter((zone) => zone.points.length >= 3)

    const typeLabel = cropType || cropKey || ''

    // Si se pidió, se crea también el cultivo para que el lote quede como cultivo
    // de una vez (con su área y las plantas estimadas en las observaciones).
    let cropId = crop || null
    if (createCrop && !cropId) {
      createdCrop = await Crop.create({
        owner: req.user.id,
        name: String(name || '').trim(),
        type: typeLabel || 'Otro',
        startDate: new Date(),
        landSize: Number((Number(areaHectares) || 0).toFixed(4)),
        landSizeUnit: 'hectáreas',
        status: 'activo',
        observations: `Creado desde la calculadora de siembra. Plantas estimadas: ${Number(estimatedPlants) || 0}.`,
      })
      cropId = createdCrop._id
    }

    const plot = await PlantingPlot.create({
      owner: req.user.id,
      crop: cropId,
      name,
      cropType: typeLabel,
      geometry: polygon,
      exclusionZones: zones,
      areaM2,
      areaHectares,
      orientation,
      patternMode,
      rowSpacing,
      rowsPerGroup,
      intraGroupSpacing,
      interGroupSpacing,
      plantSpacing,
      totalRows,
      plantsPerRow,
      estimatedPlants,
    })

    res.status(201).json({ success: true, data: plot, crop: createdCrop })
  } catch (err) {
    // Si el lote falló después de crear el cultivo, se deshace para no dejar un cultivo huérfano.
    if (createdCrop) await Crop.findByIdAndDelete(createdCrop._id).catch(() => {})
    next(err)
  }
}

export const getPlantingPlots = async (req, res, next) => {
  try {
    const plots = await PlantingPlot.find({ owner: req.user.id }).sort({ createdAt: -1 })
    res.json({ success: true, data: plots })
  } catch (err) {
    next(err)
  }
}

export const deletePlantingPlot = async (req, res, next) => {
  try {
    const plot = await PlantingPlot.findOneAndDelete({ _id: req.params.id, owner: req.user.id })
    if (!plot) {
      return res.status(404).json({ success: false, message: 'Lote no encontrado' })
    }
    res.json({ success: true, message: 'Lote eliminado' })
  } catch (err) {
    next(err)
  }
}