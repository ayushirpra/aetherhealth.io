import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

/**
 * signToken — signs a JWT with the application secret.
 * @param {object} payload — data to embed; typically { id, role }
 * @returns {string} signed JWT string
 */
export function signToken(payload) {
  if (!SECRET) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.')
  }
  const cleanPayload =
    payload && typeof payload === 'object'
      ? {
          id: (payload.id || payload._id || '').toString(),
          role: payload.role,
        }
      : payload
  return jwt.sign(cleanPayload, SECRET, { expiresIn: EXPIRES_IN })
}

/**
 * verifyToken — verifies and decodes a JWT.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyToken(token) {
  if (!SECRET) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.')
  }
  return jwt.verify(token, SECRET)
}
