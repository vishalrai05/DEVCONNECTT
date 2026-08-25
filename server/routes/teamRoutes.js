/**
 * Team routes — mounted at /api/teams
 *
 * Join routes on /:id/join and /:id/requests must be registered before
 * generic /:id handlers where paths could collide (Express matches in order).
 */

import express from 'express'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  removeMember,
} from '../controllers/teamController.js'
import {
  sendJoinRequest,
  getTeamRequests,
} from '../controllers/joinRequestController.js'
import { mutationLimiter } from '../middleware/securityMiddleware.js'

const router = express.Router()

router.get('/', optionalProtect, getTeams)
router.post('/', protect, createTeam)

router.post('/:id/join', protect, mutationLimiter, sendJoinRequest)
router.get('/:id/requests', protect, getTeamRequests)
router.delete('/:id/members/:userId', protect, removeMember)

router.get('/:id', optionalProtect, getTeamById)
router.put('/:id', protect, updateTeam)
router.delete('/:id', protect, deleteTeam)

export default router
