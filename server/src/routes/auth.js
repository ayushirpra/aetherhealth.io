import { Router } from 'express'
import { register, login, getMe } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { registerRules, loginRules, validate } from '../middleware/authValidation.js'

const router = Router()

/**
 * POST /api/auth/register
 * Register a new patient or doctor account.
 */
router.post('/register', registerRules, validate, register)

/**
 * POST /api/auth/login
 * Authenticate and receive a JWT.
 */
router.post('/login', loginRules, validate, login)

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 * Protected — requires a valid Bearer token.
 */
router.get('/me', authMiddleware, getMe)

export default router
