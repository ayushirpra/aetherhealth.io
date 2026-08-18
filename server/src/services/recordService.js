import MedicalRecord from '../models/MedicalRecord.js'
import User from '../models/User.js'
import { computeHash, encryptBuffer, decryptBuffer } from '../utils/crypto.js'
import { pinFileToIPFS, fetchFromIPFS } from './ipfsService.js'

/**
 * createRecord — patient creates a new medical record.
 */
export async function createRecord(patientId, recordData) {
  const record = await MedicalRecord.create({
    ...recordData,
    patient: patientId,
  })

  return record
}

/**
 * createRecordWithFile — creates a record and encrypts/pins an attached file to IPFS in one atomic operation.
 */
export async function createRecordWithFile(patientId, recordData, fileBuffer, fileMeta) {
  if (!fileBuffer || !fileMeta) {
    const error = new Error('File attachment is required.')
    error.status = 400
    throw error
  }

  // 1. Calculate plaintext SHA-256 integrity hash
  const fileHash = computeHash(fileBuffer)

  // 2. Encrypt buffer with AES-256-GCM
  const { encryptedBuffer, iv, authTag } = encryptBuffer(fileBuffer)

  // 3. Pin encrypted buffer to IPFS
  const safeName = `enc_${Date.now()}_${fileMeta.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { ipfsCid } = await pinFileToIPFS(encryptedBuffer, safeName, {
    originalName: fileMeta.originalname,
    mimeType: fileMeta.mimetype,
  })

  // 4. Create database record
  const record = await MedicalRecord.create({
    ...recordData,
    patient: patientId,
    ipfsCid,
    fileHash,
    iv,
    authTag,
    fileName: fileMeta.originalname,
    fileSize: fileMeta.size || fileBuffer.length,
    mimeType: fileMeta.mimetype,
  })

  return record
}

/**
 * attachFileToRecord — encrypts and uploads a file attachment to an existing record.
 */
export async function attachFileToRecord(recordId, user, fileBuffer, fileMeta) {
  const record = await MedicalRecord.findById(recordId)

  if (!record) {
    const error = new Error('Medical record not found.')
    error.status = 404
    throw error
  }

  if (record.patient.toString() !== user._id.toString()) {
    const error = new Error('Access denied. Only the record owner can attach files.')
    error.status = 403
    throw error
  }

  const fileHash = computeHash(fileBuffer)
  const { encryptedBuffer, iv, authTag } = encryptBuffer(fileBuffer)

  const safeName = `enc_${Date.now()}_${fileMeta.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { ipfsCid } = await pinFileToIPFS(encryptedBuffer, safeName, {
    recordId: record._id.toString(),
    originalName: fileMeta.originalname,
  })

  record.ipfsCid = ipfsCid
  record.fileHash = fileHash
  record.iv = iv
  record.authTag = authTag
  record.fileName = fileMeta.originalname
  record.fileSize = fileMeta.size || fileBuffer.length
  record.mimeType = fileMeta.mimetype

  await record.save()
  return record
}

/**
 * downloadRecordFile — retrieves, decrypts, and validates the file from IPFS.
 */
export async function downloadRecordFile(recordId, user) {
  const record = await MedicalRecord.findById(recordId)

  if (!record) {
    const error = new Error('Medical record not found.')
    error.status = 404
    throw error
  }

  const isAuthorized = record.isUserAuthorized(user._id, user.role)
  if (!isAuthorized) {
    const error = new Error('Access denied. You are not authorized to download this file.')
    error.status = 403
    throw error
  }

  if (!record.ipfsCid || !record.iv || !record.authTag) {
    const error = new Error('No encrypted file attachment found on IPFS for this record.')
    error.status = 404
    throw error
  }

  // 1. Fetch ciphertext from IPFS gateway
  const encryptedBuffer = await fetchFromIPFS(record.ipfsCid)

  // 2. Decrypt ciphertext using stored IV and auth tag
  let decryptedBuffer
  try {
    decryptedBuffer = decryptBuffer(encryptedBuffer, record.iv, record.authTag)
  } catch (decErr) {
    const error = new Error('Decryption failed. Authentication tag mismatch or corrupted ciphertext.')
    error.status = 500
    throw error
  }

  // 3. Verify SHA-256 integrity hash against stored value
  const computedHash = computeHash(decryptedBuffer)
  if (record.fileHash && computedHash !== record.fileHash) {
    const error = new Error('Integrity verification failed. File hash mismatch (potential tampering detected).')
    error.status = 409
    throw error
  }

  return {
    buffer: decryptedBuffer,
    fileName: record.fileName || 'medical_record',
    mimeType: record.mimeType || 'application/octet-stream',
    fileSize: record.fileSize || decryptedBuffer.length,
    fileHash: computedHash,
    ipfsCid: record.ipfsCid,
  }
}

/**
 * verifyRecordIntegrity — checks if the IPFS stored file matches the recorded SHA-256 hash.
 */
export async function verifyRecordIntegrity(recordId, user) {
  const fileData = await downloadRecordFile(recordId, user)
  return {
    verified: true,
    fileHash: fileData.fileHash,
    ipfsCid: fileData.ipfsCid,
    fileName: fileData.fileName,
  }
}

/**
 * listRecords — retrieves medical records accessible to the authenticated user.
 * - Patients see all records they own.
 * - Doctors see records where they have been granted explicit access.
 */
export async function listRecords(user, queryParams = {}) {
  const filter = {}

  if (user.role === 'patient') {
    filter.patient = user._id
  } else if (user.role === 'doctor') {
    filter.authorizedDoctors = user._id
    filter.status = 'active'
  } else {
    filter.patient = user._id
  }

  if (queryParams.recordType) {
    filter.recordType = queryParams.recordType
  }

  if (queryParams.status) {
    filter.status = queryParams.status
  }

  const records = await MedicalRecord.find(filter)
    .populate('patient', 'name email')
    .populate('authorizedDoctors', 'name email')
    .sort({ recordDate: -1, createdAt: -1 })

  return records
}

/**
 * getRecordById — retrieves a single medical record with strict authorization checks.
 */
export async function getRecordById(recordId, user) {
  const record = await MedicalRecord.findById(recordId)
    .populate('patient', 'name email')
    .populate('authorizedDoctors', 'name email')

  if (!record) {
    const error = new Error('Medical record not found.')
    error.status = 404
    throw error
  }

  const isAuthorized = record.isUserAuthorized(user._id, user.role)
  if (!isAuthorized) {
    const error = new Error('Access denied. You are not authorized to view this record.')
    error.status = 403
    throw error
  }

  return record
}

/**
 * updateRecord — updates record metadata. Only the owning patient can modify the record.
 */
export async function updateRecord(recordId, user, updateData) {
  const record = await MedicalRecord.findById(recordId)

  if (!record) {
    const error = new Error('Medical record not found.')
    error.status = 404
    throw error
  }

  // Patient ownership check
  if (record.patient.toString() !== user._id.toString()) {
    const error = new Error('Access denied. Only the record owner can update this record.')
    error.status = 403
    throw error
  }

  const allowedFields = ['title', 'recordType', 'recordDate', 'description', 'status', 'metadata']
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      record[field] = updateData[field]
    }
  })

  await record.save()
  return record
}

/**
 * deleteRecord — deletes a medical record. Only the owning patient can delete.
 */
export async function deleteRecord(recordId, user) {
  const record = await MedicalRecord.findById(recordId)

  if (!record) {
    const error = new Error('Medical record not found.')
    error.status = 404
    throw error
  }

  // Patient ownership check
  if (record.patient.toString() !== user._id.toString()) {
    const error = new Error('Access denied. Only the record owner can delete this record.')
    error.status = 403
    throw error
  }

  await MedicalRecord.findByIdAndDelete(recordId)
  return { success: true, message: 'Record deleted successfully.' }
}

/**
 * authorizeDoctor — patient grants a doctor access to view their record.
 */
export async function authorizeDoctor(recordId, patientId, doctorId) {
  const record = await MedicalRecord.findById(recordId)

  if (!record) {
    const error = new Error('Medical record not found.')
    error.status = 404
    throw error
  }

  if (record.patient.toString() !== patientId.toString()) {
    const error = new Error('Access denied. Only the record owner can manage doctor permissions.')
    error.status = 403
    throw error
  }

  const doctor = await User.findById(doctorId)
  if (!doctor || doctor.role !== 'doctor') {
    const error = new Error('Target user is not a valid doctor.')
    error.status = 400
    throw error
  }

  const alreadyAuthorized = record.authorizedDoctors.some(
    (id) => id.toString() === doctorId.toString(),
  )

  if (!alreadyAuthorized) {
    record.authorizedDoctors.push(doctorId)
    await record.save()
  }

  return record
}

/**
 * revokeDoctor — patient revokes a doctor's access to view their record.
 */
export async function revokeDoctor(recordId, patientId, doctorId) {
  const record = await MedicalRecord.findById(recordId)

  if (!record) {
    const error = new Error('Medical record not found.')
    error.status = 404
    throw error
  }

  if (record.patient.toString() !== patientId.toString()) {
    const error = new Error('Access denied. Only the record owner can manage doctor permissions.')
    error.status = 403
    throw error
  }

  record.authorizedDoctors = record.authorizedDoctors.filter(
    (id) => id.toString() !== doctorId.toString(),
  )
  await record.save()

  return record
}

