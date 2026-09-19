import { Router } from 'express'
import {
  getContributors, createContributor, deleteContributor,
  getFarmWideSummary, getCropSummary,
} from '../controllers/contributorController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', protect, getContributors)
router.post('/', protect, createContributor)
router.delete('/:id', protect, deleteContributor)
router.get('/summary/farm', protect, getFarmWideSummary)
router.get('/summary/crop/:cropId', protect, getCropSummary)

export default router