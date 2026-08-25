/**
 * Module 1 — MongoDB connection
 *
 * Why a separate db.js?
 * Keeping the database connection in its own module keeps server.js focused
 * on HTTP setup and makes the connection reusable / easier to test.
 *
 * Development fallback:
 * If MONGO_URI is missing or still the placeholder text, we spin up an
 * in-memory MongoDB so the API starts without Atlas configuration.
 * For production / real data, set a valid Atlas URI in server/.env.
 */

import mongoose from 'mongoose'

const PLACEHOLDER_MARKERS = [
  'your_mongodb_atlas_connection_string',
  'mongodb+srv://username:password',
  'replace_me',
]

const isPlaceholderUri = (uri) => {
  if (!uri || typeof uri !== 'string') return true
  const trimmed = uri.trim()
  if (!trimmed) return true
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    return true
  }
  return PLACEHOLDER_MARKERS.some((marker) => trimmed.includes(marker))
}

const connectDB = async () => {
  let uri = process.env.MONGO_URI?.trim()
  const isDev = (process.env.NODE_ENV || 'development') !== 'production'

  try {
    if (isPlaceholderUri(uri)) {
      if (!isDev) {
        console.error(
          'MONGO_URI is missing or invalid. Set a real MongoDB Atlas connection string in server/.env',
        )
        process.exit(1)
      }

      // In-memory DB — great for local hackathon dev; data resets when server stops
      const { MongoMemoryServer } = await import('mongodb-memory-server')
      const memoryServer = await MongoMemoryServer.create()
      uri = memoryServer.getUri()
      process.env.MONGO_URI = uri

      console.log('⚠️  Using in-memory MongoDB (dev fallback).')
      console.log('   Set MONGO_URI in server/.env to use MongoDB Atlas with persistent data.')
    }

    const connection = await mongoose.connect(uri)
    console.log(`MongoDB connected: ${connection.connection.host}`)
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    console.error('')
    console.error('Fix: open server/.env and set MONGO_URI to your Atlas connection string, e.g.')
    console.error('MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/devconnect')
    process.exit(1)
  }
}

export default connectDB
