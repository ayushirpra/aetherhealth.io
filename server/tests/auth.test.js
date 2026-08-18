/**
 * auth.test.js — Phase 2 authentication tests
 *
 * Uses mongodb-memory-server so tests run fully offline (Atlas SSL issue is bypassed).
 * Each test group runs against a fresh in-process MongoDB instance.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../src/app.js'

// ── Environment setup (read before any app module runs) ───────────────────────
// These must be set at module evaluation time so jwt.js / authService.js see them.
process.env.JWT_SECRET = 'test-secret-key-for-vitest-only'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV = 'test'
// Provide a dummy URI so dotenv-config in app.js doesn't throw.
// The real connection is replaced by MongoMemoryServer below.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test-placeholder'

let mongod
let app

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await mongoose.connect(uri)
  app = createApp()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  // Clear all collections between tests for isolation
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const validPatient = {
  name: 'Alice Test',
  email: 'alice@example.com',
  password: 'securePass1',
  role: 'patient',
}

const validDoctor = {
  name: 'Dr. Bob Test',
  email: 'bob@example.com',
  password: 'securePass2',
  role: 'doctor',
}

async function registerAndGetToken(payload = validPatient) {
  const res = await request(app).post('/api/auth/register').send(payload)
  return res.body.token
}

// ── Register ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a patient and returns 201 with token + user (no passwordHash)', async () => {
    const res = await request(app).post('/api/auth/register').send(validPatient)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.token.length).toBeGreaterThan(0)

    const { user } = res.body
    expect(user.email).toBe(validPatient.email.toLowerCase())
    expect(user.name).toBe(validPatient.name)
    expect(user.role).toBe('patient')
    // passwordHash must NEVER appear in the response
    expect(user.passwordHash).toBeUndefined()
  })

  it('registers a doctor with role "doctor"', async () => {
    const res = await request(app).post('/api/auth/register').send(validDoctor)

    expect(res.status).toBe(201)
    expect(res.body.user.role).toBe('doctor')
  })

  it('returns 409 when the same email is registered twice', async () => {
    await request(app).post('/api/auth/register').send(validPatient)
    const res = await request(app).post('/api/auth/register').send(validPatient)

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('returns 422 when name is missing', async () => {
    const { name: _n, ...body } = validPatient
    const res = await request(app).post('/api/auth/register').send(body)

    expect(res.status).toBe(422)
    expect(res.body.errors.some((e) => e.field === 'name')).toBe(true)
  })

  it('returns 422 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPatient, email: 'not-an-email' })

    expect(res.status).toBe(422)
    expect(res.body.errors.some((e) => e.field === 'email')).toBe(true)
  })

  it('returns 422 when password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPatient, password: 'short' })

    expect(res.status).toBe(422)
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true)
  })

  it('returns 422 when role is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPatient, role: 'admin' })

    expect(res.status).toBe(422)
    expect(res.body.errors.some((e) => e.field === 'role')).toBe(true)
  })
})

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials and returns 200 with token', async () => {
    await request(app).post('/api/auth/register').send(validPatient)

    const res = await request(app).post('/api/auth/login').send({
      email: validPatient.email,
      password: validPatient.password,
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('returns 401 for a wrong password', async () => {
    await request(app).post('/api/auth/register').send(validPatient)

    const res = await request(app).post('/api/auth/login').send({
      email: validPatient.email,
      password: 'wrongPassword!',
    })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 for an unregistered email (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'doesNotMatter1',
    })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    // Response must not distinguish between "wrong email" and "wrong password"
    expect(res.body.message).toMatch(/invalid email or password/i)
  })

  it('returns 422 when email is missing from login body', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'somePass1' })

    expect(res.status).toBe(422)
  })
})

// ── Protected route GET /api/auth/me ─────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns 200 with the user object when a valid token is provided', async () => {
    const token = await registerAndGetToken()

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user.email).toBe(validPatient.email.toLowerCase())
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 when a malformed/invalid token is sent', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
