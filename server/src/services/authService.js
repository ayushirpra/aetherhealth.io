import bcrypt from 'bcrypt'
import User from '../models/User.js'
import { signToken } from '../utils/jwt.js'

const BCRYPT_ROUNDS = 12

/**
 * registerUser — create a new user account.
 * @param {{ name: string, email: string, password: string, role: string }} data
 * @returns {{ user: object, token: string }}
 * @throws 409 if email already registered
 */
export async function registerUser({ name, email, password, role }) {
  // Check for duplicate email
  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    const err = new Error('An account with this email already exists.')
    err.status = 409
    throw err
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const user = await User.create({ name, email, passwordHash, role })

  const token = signToken({ id: user._id, role: user.role })

  return { user: user.toSafeObject(), token }
}

/**
 * loginUser — authenticate an existing user.
 * @param {{ email: string, password: string }} data
 * @returns {{ user: object, token: string }}
 * @throws 401 on invalid credentials (generic — no enumeration)
 */
export async function loginUser({ email, password }) {
  // Include passwordHash for comparison
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash')

  // Use a generic message to prevent email enumeration
  const invalidErr = new Error('Invalid email or password.')
  invalidErr.status = 401

  if (!user) throw invalidErr

  const match = await user.comparePassword(password)
  if (!match) throw invalidErr

  const token = signToken({ id: user._id, role: user.role })

  return { user: user.toSafeObject(), token }
}
