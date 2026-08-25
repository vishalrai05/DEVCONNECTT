import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { getTeamMessages } from '../controllers/messageController.js'
import { chatLimiter } from '../middleware/securityMiddleware.js'

const router = express.Router()

router.get('/teams/:id/messages', protect, chatLimiter, getTeamMessages)

export default router
