/**
 * records.test.js — Phase 3 Medical Records backend tests
 *
 * Uses mongodb-memory-server so tests run fully offline in isolation.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../src/app.js'

process.env.JWT_SECRET = 'test-secret-key-for-records-vitest-only'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test-placeholder'

let mongod
let app

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
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createTestUser({ name, email, password = 'password123', role }) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password, role })
  return { token: res.body.token, user: res.body.user }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Medical Records API (/api/records)', () => {
  // ── 1. Create Record ────────────────────────────────────────────────────────
  describe('POST /api/records', () => {
    it('allows a patient to create a medical record', async () => {
      const patient = await createTestUser({
        name: 'Alice Patient',
        email: 'alice@test.com',
        role: 'patient',
      })

      const recordData = {
        title: 'Blood Test - Lipid Panel',
        recordType: 'lab_report',
        recordDate: '2026-08-15T10:00:00.000Z',
        description: 'Routine annual lipid screening.',
      }

      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send(recordData)

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.record.title).toBe(recordData.title)
      expect(res.body.record.recordType).toBe('lab_report')
      expect(res.body.record.status).toBe('active')
      expect(res.body.record.patient).toBe(patient.user._id)
    })

    it('rejects record creation with missing title (422)', async () => {
      const patient = await createTestUser({
        name: 'Alice Patient',
        email: 'alice@test.com',
        role: 'patient',
      })

      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ recordType: 'lab_report' })

      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
      expect(res.body.errors.some((e) => e.field === 'title')).toBe(true)
    })

    it('rejects record creation with invalid recordType (422)', async () => {
      const patient = await createTestUser({
        name: 'Alice Patient',
        email: 'alice@test.com',
        role: 'patient',
      })

      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'MRI Scan', recordType: 'invalid_type' })

      expect(res.status).toBe(422)
      expect(res.body.errors.some((e) => e.field === 'recordType')).toBe(true)
    })

    it('prevents a doctor from creating a patient medical record directly (403)', async () => {
      const doctor = await createTestUser({
        name: 'Dr. House',
        email: 'house@hospital.org',
        role: 'doctor',
      })

      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${doctor.token}`)
        .send({ title: 'Doctor Diagnostic Note' })

      expect(res.status).toBe(403)
      expect(res.body.message).toMatch(/only patients can create/i)
    })

    it('rejects unauthenticated creation requests (401)', async () => {
      const res = await request(app)
        .post('/api/records')
        .send({ title: 'Secret Record' })

      expect(res.status).toBe(401)
    })
  })

  // ── 2. List Records ─────────────────────────────────────────────────────────
  describe('GET /api/records', () => {
    it('returns only records owned by the authenticated patient', async () => {
      const patient1 = await createTestUser({
        name: 'Patient 1',
        email: 'p1@test.com',
        role: 'patient',
      })
      const patient2 = await createTestUser({
        name: 'Patient 2',
        email: 'p2@test.com',
        role: 'patient',
      })

      // Patient 1 creates 2 records
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient1.token}`)
        .send({ title: 'P1 Record 1', recordType: 'prescription' })

      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient1.token}`)
        .send({ title: 'P1 Record 2', recordType: 'lab_report' })

      // Patient 2 creates 1 record
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient2.token}`)
        .send({ title: 'P2 Record 1', recordType: 'radiology' })

      // Patient 1 lists records
      const res1 = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${patient1.token}`)

      expect(res1.status).toBe(200)
      expect(res1.body.count).toBe(2)
      expect(res1.body.records.every((r) => r.patient._id === patient1.user._id)).toBe(true)

      // Filter by recordType
      const resFilter = await request(app)
        .get('/api/records?recordType=prescription')
        .set('Authorization', `Bearer ${patient1.token}`)

      expect(resFilter.status).toBe(200)
      expect(resFilter.body.count).toBe(1)
      expect(resFilter.body.records[0].title).toBe('P1 Record 1')
    })

    it('returns only explicitly authorized records for a doctor', async () => {
      const patient = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const doctor = await createTestUser({
        name: 'Dr. House',
        email: 'house@test.com',
        role: 'doctor',
      })

      // Patient creates 2 records
      const rec1 = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'Authorized Lab Report', recordType: 'lab_report' })

      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'Private Consultation Note', recordType: 'consultation_note' })

      // Patient authorizes doctor on rec1
      await request(app)
        .post(`/api/records/${rec1.body.record._id}/authorize`)
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ doctorId: doctor.user._id })

      // Doctor lists records
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${doctor.token}`)

      expect(res.status).toBe(200)
      expect(res.body.count).toBe(1)
      expect(res.body.records[0].title).toBe('Authorized Lab Report')
    })
  })

  // ── 3. Get Record by ID ─────────────────────────────────────────────────────
  describe('GET /api/records/:id', () => {
    it('allows patient owner to get record detail', async () => {
      const patient = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'My Ultrasound' })

      const res = await request(app)
        .get(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${patient.token}`)

      expect(res.status).toBe(200)
      expect(res.body.record.title).toBe('My Ultrasound')
    })

    it('denies access to another patient (403)', async () => {
      const patient1 = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const patient2 = await createTestUser({
        name: 'Bob',
        email: 'bob@test.com',
        role: 'patient',
      })

      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient1.token}`)
        .send({ title: 'Confidential Diagnosis' })

      const res = await request(app)
        .get(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${patient2.token}`)

      expect(res.status).toBe(403)
    })

    it('allows authorized doctor to access record detail', async () => {
      const patient = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const doctor = await createTestUser({
        name: 'Dr. House',
        email: 'house@test.com',
        role: 'doctor',
      })

      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'EKG Report' })

      await request(app)
        .post(`/api/records/${created.body.record._id}/authorize`)
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ doctorId: doctor.user._id })

      const res = await request(app)
        .get(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${doctor.token}`)

      expect(res.status).toBe(200)
      expect(res.body.record.title).toBe('EKG Report')
    })

    it('denies access to an unauthorized doctor (403)', async () => {
      const patient = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const doctor = await createTestUser({
        name: 'Dr. Strange',
        email: 'strange@test.com',
        role: 'doctor',
      })

      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'Private Genetic Report' })

      const res = await request(app)
        .get(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${doctor.token}`)

      expect(res.status).toBe(403)
    })
  })

  // ── 4. Update Record ────────────────────────────────────────────────────────
  describe('PUT /api/records/:id', () => {
    it('allows patient owner to update their record metadata', async () => {
      const patient = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'Initial Title', description: 'Initial description.' })

      const res = await request(app)
        .put(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'Updated Title', description: 'Updated description.' })

      expect(res.status).toBe(200)
      expect(res.body.record.title).toBe('Updated Title')
      expect(res.body.record.description).toBe('Updated description.')
    })

    it('prevents non-owners from updating the record (403)', async () => {
      const patient1 = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const patient2 = await createTestUser({
        name: 'Bob',
        email: 'bob@test.com',
        role: 'patient',
      })
      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient1.token}`)
        .send({ title: 'Alice Report' })

      const res = await request(app)
        .put(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${patient2.token}`)
        .send({ title: 'Hacked Title' })

      expect(res.status).toBe(403)
    })
  })

  // ── 5. Delete Record ────────────────────────────────────────────────────────
  describe('DELETE /api/records/:id', () => {
    it('allows patient owner to delete their record', async () => {
      const patient = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'Temporary Record' })

      const res = await request(app)
        .delete(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${patient.token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Verify it is gone
      const check = await request(app)
        .get(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${patient.token}`)

      expect(check.status).toBe(404)
    })

    it('prevents non-owners from deleting the record (403)', async () => {
      const patient1 = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const patient2 = await createTestUser({
        name: 'Bob',
        email: 'bob@test.com',
        role: 'patient',
      })
      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient1.token}`)
        .send({ title: 'Protected Record' })

      const res = await request(app)
        .delete(`/api/records/${created.body.record._id}`)
        .set('Authorization', `Bearer ${patient2.token}`)

      expect(res.status).toBe(403)
    })
  })

  // ── 6. Doctor Authorization & Revocation ────────────────────────────────────
  describe('POST /api/records/:id/authorize and /revoke', () => {
    it('allows patient to grant and revoke doctor access', async () => {
      const patient = await createTestUser({
        name: 'Alice',
        email: 'alice@test.com',
        role: 'patient',
      })
      const doctor = await createTestUser({
        name: 'Dr. House',
        email: 'house@test.com',
        role: 'doctor',
      })

      const created = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ title: 'Cardiology Report' })

      // Authorize
      const authRes = await request(app)
        .post(`/api/records/${created.body.record._id}/authorize`)
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ doctorId: doctor.user._id })

      expect(authRes.status).toBe(200)
      expect(authRes.body.record.authorizedDoctors.includes(doctor.user._id)).toBe(true)

      // Revoke
      const revokeRes = await request(app)
        .post(`/api/records/${created.body.record._id}/revoke`)
        .set('Authorization', `Bearer ${patient.token}`)
        .send({ doctorId: doctor.user._id })

      expect(revokeRes.status).toBe(200)
      expect(revokeRes.body.record.authorizedDoctors.includes(doctor.user._id)).toBe(false)
    })
  })
})
