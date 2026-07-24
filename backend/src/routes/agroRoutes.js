import { Router } from 'express'
import { getAgroConversation, postAgroMessage, startNewAgroConversation } from '../controllers/agroChatController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/conversation', protect, getAgroConversation)
router.post('/conversation/new', protect, startNewAgroConversation)
router.post('/conversation/:id/message', protect, postAgroMessage)

export default router