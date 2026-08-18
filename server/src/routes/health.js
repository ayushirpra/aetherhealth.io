import { Router } from 'express'

const router = Router()

/**
 * GET /api/health
 * Simple liveness check — confirms the server is running.
 * No database call here; DB status will be added in Phase 2.
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'aetherhealth-api',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  })
})

export default router
