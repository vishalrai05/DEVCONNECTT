/**
 * Matching routes — mounted at /api/matching
 * All endpoints require authentication.
 */

import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getRecommendations,
  inviteToTeam,
  getMatchingMeta,
} from '../controllers/matchingController.js'

const router = express.Router()

router.get('/meta', protect, getMatchingMeta)
router.get('/recommendations', protect, getRecommendations)
router.post('/invite', protect, inviteToTeam)

export default router
