import MedicalRecord from '../models/MedicalRecord.js'
import User from '../models/User.js'

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
