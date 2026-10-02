import { Router } from 'express'
import { getAssistantConversation, postAssistantMessage, startNewAssistantConversation } from '../controllers/assistantChatController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/conversation', protect, getAssistantConversation)
router.post('/conversation/new', protect, startNewAssistantConversation)
router.post('/conversation/:id/message', protect, postAssistantMessage)

export default router