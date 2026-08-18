import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../src/app.js'
import User from '../src/models/User.js'
import MedicalRecord from '../src/models/MedicalRecord.js'
import { signToken } from '../src/utils/jwt.js'
import { encryptBuffer, decryptBuffer, computeHash } from '../src/utils/crypto.js'
import * as ipfsService from '../src/services/ipfsService.js'

let mongoServer
let app
let patientUser
let patientToken
let doctorUser
let doctorToken
let otherPatientUser
let otherPatientToken

// In-memory mock IPFS storage map: CID -> Buffer (encrypted)
const mockIpfsStorage = new Map()

describe('Secure IPFS Foundation & Encryption (Phase 4 Task 1)', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_ipfs_testing_123456789'
    process.env.ENCRYPTION_KEY = 'test_32_byte_aes_encryption_key_sample_secret_key'
    process.env.PINATA_JWT = 'mock_pinata_jwt_token'

    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
    app = createApp()

    // Mock Pinata IPFS Service methods
    vi.spyOn(ipfsService, 'pinFileToIPFS').mockImplementation(async (encryptedBuffer, fileName) => {
      const mockCid = `bafybeimockcid${computeHash(encryptedBuffer).slice(0, 16)}`
      mockIpfsStorage.set(mockCid, encryptedBuffer)
      return {
        ipfsCid: mockCid,
        pinSize: encryptedBuffer.length,
        timestamp: new Date().toISOString(),
      }
    })

    vi.spyOn(ipfsService, 'fetchFromIPFS').mockImplementation(async (cid) => {
      if (!mockIpfsStorage.has(cid)) {
        throw new Error(`CID ${cid} not found in mock IPFS.`)
      }
      return mockIpfsStorage.get(cid)
    })
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
    vi.restoreAllMocks()
  })

  beforeEach(async () => {
    await User.deleteMany({})
    await MedicalRecord.deleteMany({})
    mockIpfsStorage.clear()

    // Create test patient
    patientUser = await User.create({
      name: 'Alice Patient',
      email: 'alice.ipfs@test.com',
      passwordHash: 'hashedpassword',
      role: 'patient',
    })
    patientToken = signToken({ id: patientUser._id, role: patientUser.role })

    // Create test doctor
    doctorUser = await User.create({
      name: 'Dr. Gregory House',
      email: 'house.ipfs@test.com',
      passwordHash: 'hashedpassword',
      role: 'doctor',
    })
    doctorToken = signToken({ id: doctorUser._id, role: doctorUser.role })

    // Create second patient
    otherPatientUser = await User.create({
      name: 'Bob Patient',
      email: 'bob.ipfs@test.com',
      passwordHash: 'hashedpassword',
      role: 'patient',
    })
    otherPatientToken = signToken({ id: otherPatientUser._id, role: otherPatientUser.role })
  })

  describe('Crypto Utility (AES-256-GCM & SHA-256)', () => {
    it('encrypts plaintext buffer and decrypts back to original content', () => {
      const plaintext = Buffer.from('CONFIDENTIAL MEDICAL RECORD: Blood Glucose: 95 mg/dL')
      const { encryptedBuffer, iv, authTag } = encryptBuffer(plaintext)

      expect(encryptedBuffer).toBeDefined()
      expect(encryptedBuffer.equals(plaintext)).toBe(false)
      expect(iv).toHaveLength(32) // 16 bytes = 32 hex chars
      expect(authTag).toHaveLength(32) // 16 bytes = 32 hex chars

      const decrypted = decryptBuffer(encryptedBuffer, iv, authTag)
      expect(decrypted.toString()).toBe(plaintext.toString())
    })

    it('computes consistent SHA-256 integrity hash', () => {
      const fileData = Buffer.from('Patient Lab Test Data')
      const hash1 = computeHash(fileData)
      const hash2 = computeHash(fileData)

      expect(hash1).toHaveLength(64)
      expect(hash1).toBe(hash2)
    })

    it('fails decryption when ciphertext or authTag is tampered with', () => {
      const plaintext = Buffer.from('Original Prescriptions')
      const { encryptedBuffer, iv, authTag } = encryptBuffer(plaintext)

      // Tamper with the ciphertext
      const tamperedCiphertext = Buffer.from(encryptedBuffer)
      tamperedCiphertext[0] ^= 0xff

      expect(() => {
        decryptBuffer(tamperedCiphertext, iv, authTag)
      }).toThrow()
    })
  })

  describe('Encrypted Upload & IPFS Storage (/api/records/upload)', () => {
    it('allows patient to create record with encrypted file attachment', async () => {
      const samplePdfContent = Buffer.from('%PDF-1.4 Medical Blood Panel Report Content')

      const res = await request(app)
        .post('/api/records/upload')
        .set('Authorization', `Bearer ${patientToken}`)
        .field('title', 'Annual Blood Panel')
        .field('recordType', 'lab_report')
        .field('recordDate', '2026-08-18')
        .field('description', 'Comprehensive metabolic profile')
        .attach('file', samplePdfContent, {
          filename: 'blood_panel.pdf',
          contentType: 'application/pdf',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.record.title).toBe('Annual Blood Panel')
      expect(res.body.record.ipfsCid).toMatch(/^bafybei/)
      expect(res.body.record.fileHash).toBe(computeHash(samplePdfContent))
      expect(res.body.record.fileName).toBe('blood_panel.pdf')
      expect(res.body.record.mimeType).toBe('application/pdf')

      // Verify that data stored on IPFS is CIPHERTEXT, not plaintext
      const storedCiphertext = mockIpfsStorage.get(res.body.record.ipfsCid)
      expect(storedCiphertext).toBeDefined()
      expect(storedCiphertext.includes(samplePdfContent)).toBe(false)
    })

    it('rejects unsupported file MIME types (400)', async () => {
      const forbiddenFile = Buffer.from('executable binary code')

      const res = await request(app)
        .post('/api/records/upload')
        .set('Authorization', `Bearer ${patientToken}`)
        .field('title', 'Malicious File')
        .attach('file', forbiddenFile, {
          filename: 'program.exe',
          contentType: 'application/x-msdownload',
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/unsupported file type/i)
    })

    it('prevents doctors from creating records directly (403)', async () => {
      const sampleFile = Buffer.from('Patient chart')

      const res = await request(app)
        .post('/api/records/upload')
        .set('Authorization', `Bearer ${doctorToken}`)
        .field('title', 'Doctor Created Record')
        .attach('file', sampleFile, {
          filename: 'chart.pdf',
          contentType: 'application/pdf',
        })

      expect(res.status).toBe(403)
      expect(res.body.message).toMatch(/only patients/i)
    })

    it('allows patient to attach encrypted file to an existing record', async () => {
      const existingRecord = await MedicalRecord.create({
        patient: patientUser._id,
        title: 'Initial Consultation Note',
        recordType: 'consultation_note',
      })

      const attachmentBuffer = Buffer.from('Doctor Prescription Notes Document')

      const res = await request(app)
        .post(`/api/records/${existingRecord._id}/attachment`)
        .set('Authorization', `Bearer ${patientToken}`)
        .attach('file', attachmentBuffer, {
          filename: 'prescription_note.txt',
          contentType: 'text/plain',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.record.ipfsCid).toBeDefined()
      expect(res.body.record.fileHash).toBe(computeHash(attachmentBuffer))
      expect(res.body.record.fileName).toBe('prescription_note.txt')
    })
  })

  describe('Secure Download & Decryption (/api/records/:id/download)', () => {
    let encryptedRecord
    const originalFileContent = Buffer.from('CONFIDENTIAL LAB RESULTS: CBC & Lipids')

    beforeEach(async () => {
      const { encryptedBuffer, iv, authTag } = encryptBuffer(originalFileContent)
      const mockCid = 'bafybeidownloadtestcid12345'
      mockIpfsStorage.set(mockCid, encryptedBuffer)

      encryptedRecord = await MedicalRecord.create({
        patient: patientUser._id,
        title: 'Lipid Panel Report',
        recordType: 'lab_report',
        ipfsCid: mockCid,
        fileHash: computeHash(originalFileContent),
        iv,
        authTag,
        fileName: 'lipid_panel.pdf',
        fileSize: originalFileContent.length,
        mimeType: 'application/pdf',
        authorizedDoctors: [doctorUser._id],
      })
    })

    it('allows patient owner to download and decrypt file', async () => {
      const res = await request(app)
        .get(`/api/records/${encryptedRecord._id}/download`)
        .set('Authorization', `Bearer ${patientToken}`)

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('application/pdf')
      expect(res.headers['content-disposition']).toContain('lipid_panel.pdf')
      expect(res.headers['x-file-hash']).toBe(computeHash(originalFileContent))
      expect(res.body.toString()).toBe(originalFileContent.toString())
    })

    it('allows authorized doctor to download and decrypt file', async () => {
      const res = await request(app)
        .get(`/api/records/${encryptedRecord._id}/download`)
        .set('Authorization', `Bearer ${doctorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.toString()).toBe(originalFileContent.toString())
    })

    it('denies download access to an unauthorized patient (403)', async () => {
      const res = await request(app)
        .get(`/api/records/${encryptedRecord._id}/download`)
        .set('Authorization', `Bearer ${otherPatientToken}`)

      expect(res.status).toBe(403)
      expect(res.body.message).toMatch(/access denied/i)
    })

    it('denies download access to an unauthorized doctor (403)', async () => {
      const unauthorizedDoctor = await User.create({
        name: 'Dr. Strangelove',
        email: 'strangelove.ipfs@test.com',
        passwordHash: 'hashed',
        role: 'doctor',
      })
      const unauthDocToken = signToken(unauthorizedDoctor)

      const res = await request(app)
        .get(`/api/records/${encryptedRecord._id}/download`)
        .set('Authorization', `Bearer ${unauthDocToken}`)

      expect(res.status).toBe(403)
    })

    it('verifies SHA-256 integrity check (/api/records/:id/verify)', async () => {
      const res = await request(app)
        .get(`/api/records/${encryptedRecord._id}/verify`)
        .set('Authorization', `Bearer ${patientToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.verified).toBe(true)
      expect(res.body.fileHash).toBe(computeHash(originalFileContent))
    })

    it('detects file tampering and rejects download with 409 Integrity Error', async () => {
      // Simulate corrupted data on IPFS
      const corruptPlaintext = Buffer.from('TAMPERED RECORD DATA')
      const { encryptedBuffer: corruptEnc, iv: corruptIv, authTag: corruptTag } = encryptBuffer(corruptPlaintext)
      
      const tamperedRecord = await MedicalRecord.create({
        patient: patientUser._id,
        title: 'Tampered Record',
        recordType: 'lab_report',
        ipfsCid: 'bafybeitamperedcid',
        fileHash: computeHash(originalFileContent), // recorded hash is different from corruptPlaintext
        iv: corruptIv,
        authTag: corruptTag,
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
      })
      mockIpfsStorage.set('bafybeitamperedcid', corruptEnc)

      const res = await request(app)
        .get(`/api/records/${tamperedRecord._id}/download`)
        .set('Authorization', `Bearer ${patientToken}`)

      expect(res.status).toBe(409)
      expect(res.body.message).toMatch(/integrity verification failed/i)
    })
  })
})
