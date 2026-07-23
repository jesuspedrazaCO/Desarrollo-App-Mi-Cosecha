import PlantingPlot from '../models/PlantingPlot.js'

export const createPlantingPlot = async (req, res, next) => {
  try {
    const { name, cropType, crop, geometry, areaM2, areaHectares, rowSpacing, plantSpacing, estimatedPlants } = req.body

    if (!geometry || geometry.length < 3) {
      return res.status(400).json({ success: false, message: 'El lote necesita al menos 3 puntos' })
    }

    const plot = await PlantingPlot.create({
      owner: req.user.id,
      crop: crop || null,
      name,
      cropType,
      geometry,
      areaM2,
      areaHectares,
      rowSpacing,
      plantSpacing,
      estimatedPlants,
    })

    res.status(201).json({ success: true, data: plot })
  } catch (err) {
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