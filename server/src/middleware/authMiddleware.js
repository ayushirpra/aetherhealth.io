import User from '../models/User.js'
import { verifyToken } from '../utils/jwt.js'

/**
 * authMiddleware — protects routes by verifying a Bearer JWT.
 *
 * Expects: Authorization: Bearer <token>
 *
 * On success: attaches the full User document (without passwordHash) to req.user.
 * On failure: responds 401 — never passes auth errors downstream.
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] ?? req.headers['Authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication token required.' })
  }

  const token = authHeader.slice(7) // strip "Bearer "

  try {
    const decoded = verifyToken(token)

    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' })
    }

    req.user = user.toSafeObject()
    next()
  } catch {
    // Catches JsonWebTokenError, TokenExpiredError, etc.
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' })
  }
}
