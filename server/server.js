/**
 * Module 8 — Express server entry point
 *
 * Responsibilities:
 * - Load environment variables
 * - Connect to MongoDB
 * - Configure middleware (JSON, cookies, CORS)
 * - Mount API routes
 * - Start listening for requests
 */

import express from 'express'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import hackathonRoutes from './routes/hackathonRoutes.js'
import teamRoutes from './routes/teamRoutes.js'
import requestRoutes from './routes/requestRoutes.js'
import teamPostRoutes from './routes/teamPostRoutes.js'
import matchingRoutes from './routes/matchingRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import { createSocketServer } from './socket/socketServer.js'
import { sameOrigin, validateProductionConfig } from './middleware/securityMiddleware.js'

// Load .env into process.env before anything else reads those values
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) })
validateProductionConfig()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 5000

// ---- Middleware ----

/**
 * Why express.json()?
 * Parses JSON request bodies so req.body is available in controllers.
 */
app.use(helmet())
app.use(express.json({ limit: '1mb' }))

/**
 * Why cookie-parser?
 * Populates req.cookies so auth middleware can read the HTTP-only JWT cookie.
 */
app.use(cookieParser())

/**
 * Why CORS with credentials?
 * The frontend (Vite) and backend (Express) run on different origins in
 * development. browsers block cross-origin cookie sends unless:
 *   1. CORS allows the specific frontend origin (not "*")
 *   2. credentials: true is set on both server and Axios (withCredentials)
 */
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use('/api', sameOrigin)

// ---- Routes ----
app.use('/api/auth', authRoutes)
// Phase 3 — developer profile CRUD + public profiles + avatar upload
app.use('/api/users', userRoutes)
// Phase 4 — hackathon discovery, bookmarks, admin management
app.use('/api/hackathons', hackathonRoutes)
// Phase 5 — team formation, recruitment board, join requests
app.use('/api/teams', teamRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/team-posts', teamPostRoutes)
// Phase 6 — AI teammate matching (deterministic weighted scoring)
app.use('/api/matching', matchingRoutes)
// Phase 7 — persisted team chat history
app.use('/api', messageRoutes)

// Health check — useful for confirming the API is up
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'DevConnect API is running.' })
})

// ---- 404 for unknown API routes ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' })
})

// ---- Centralized error handler ----
// Express error middleware must have 4 parameters (err, req, res, next)
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error. Please try again later.',
  })
})

// ---- Start server after DB connects ----
const startServer = async () => {
  await connectDB()

  createSocketServer(httpServer, process.env.CLIENT_URL || 'http://localhost:5173')

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
  })
}

startServer()
