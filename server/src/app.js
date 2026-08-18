import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import recordsRouter from './routes/records.js'

/**
 * createApp — builds and returns the configured Express application.
 * Exported separately so tests can import it without starting the server.
 */
export function createApp() {
  const app = express()

  // ── Security middleware ─────────────────────────────────────────────────────
  app.use(helmet())

  // ── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173']

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  )

  // ── Rate limiting ──────────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests. Please try again later.' },
    }),
  )

  // ── Body parsers ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // ── Request logging ────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'))
  }

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.use('/api', healthRouter)
  app.use('/api/auth', authRouter)          // Phase 2
  app.use('/api/records', recordsRouter)    // Phase 3

  // More route modules will be mounted here in later phases:
  // app.use('/api/access',  accessRouter)    // Phase 6

  // ── 404 handler ────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' })
  })

  // ── Global error handler ───────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err)
    res.status(err.status ?? 500).json({
      success: false,
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error.'
          : err.message,
    })
  })

  return app
}
