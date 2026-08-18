import { registerUser, loginUser } from '../services/authService.js'

/**
 * register — POST /api/auth/register
 * Creates a new user and returns a JWT.
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body
    const { user, token } = await registerUser({ name, email, password, role })
    res.status(201).json({ success: true, token, user })
  } catch (err) {
    next(err)
  }
}

/**
 * login — POST /api/auth/login
 * Authenticates a user and returns a JWT.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const { user, token } = await loginUser({ email, password })
    res.status(200).json({ success: true, token, user })
  } catch (err) {
    next(err)
  }
}

/**
 * getMe — GET /api/auth/me
 * Returns the currently authenticated user (populated by authMiddleware).
 */
export function getMe(req, res) {
  res.status(200).json({ success: true, user: req.user })
}
