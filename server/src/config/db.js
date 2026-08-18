import 'dotenv/config'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined. Add it to your .env file.')
}

let isConnected = false

/**
 * connectDB — connects to MongoDB Atlas.
 * Called once at server startup; subsequent calls are no-ops.
 */
export async function connectDB() {
  if (isConnected) return

  try {
    await mongoose.connect(MONGODB_URI, {
      // Mongoose 8+ has sensible defaults; no extra options needed.
    })
    isConnected = true
    console.log('✅ MongoDB connected:', mongoose.connection.host)
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  }
}
