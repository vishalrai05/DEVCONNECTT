/**
 * Team post (recruitment board) routes — /api/team-posts
 */

import express from 'express'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'
import {
  createTeamPost,
  getTeamPosts,
  updateTeamPost,
  deactivateTeamPost,
} from '../controllers/teamController.js'

const router = express.Router()

router.get('/', optionalProtect, getTeamPosts)
router.post('/', protect, createTeamPost)
router.put('/:id', protect, updateTeamPost)
router.delete('/:id', protect, deactivateTeamPost)

export default router
