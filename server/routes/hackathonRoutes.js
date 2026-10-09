/**
 * Hackathon routes — mounted at /api/hackathons
 *
 * Order matters:
 * Static paths (featured, recommended, stats) MUST come before /:id
 * or Express will treat "featured" as an id.
 */

import express from 'express'
import {
  protect,
  optionalProtect,
  adminOnly,
} from '../middleware/authMiddleware.js'
import {
  getHackathons,
  getFeaturedHackathons,
  getHackathonStats,
  getRecommendedHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  syncEventbrite,
  bookmarkHackathon,
  unbookmarkHackathon,
} from '../controllers/hackathonController.js'

const router = express.Router()

// Public discovery (optionalProtect annotates bookmarks when logged in)
router.get('/', optionalProtect, getHackathons)
router.get('/featured', optionalProtect, getFeaturedHackathons)
router.get('/stats', getHackathonStats)
router.get('/recommended', protect, getRecommendedHackathons)

// Admin CRUD
router.post('/', protect, adminOnly, createHackathon)
router.post('/sync/eventbrite', protect, adminOnly, syncEventbrite)

// Bookmarks — must be before generic /:id GET? Actually bookmark uses POST/DELETE
router.post('/:id/bookmark', protect, bookmarkHackathon)
router.delete('/:id/bookmark', protect, unbookmarkHackathon)

router.get('/:id', optionalProtect, getHackathonById)
router.put('/:id', protect, adminOnly, updateHackathon)
router.delete('/:id', protect, adminOnly, deleteHackathon)

export default router
