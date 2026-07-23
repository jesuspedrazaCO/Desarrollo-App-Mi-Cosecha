import { Router } from 'express'
import { createPlantingPlot, getPlantingPlots, deletePlantingPlot } from '../controllers/plantingPlotController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', protect, getPlantingPlots)
router.post('/', protect, createPlantingPlot)
router.delete('/:id', protect, deletePlantingPlot)

export default router