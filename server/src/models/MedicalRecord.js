import mongoose from 'mongoose'

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Record title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    recordType: {
      type: String,
      required: [true, 'Record type is required.'],
      enum: {
        values: [
          'lab_report',
          'prescription',
          'radiology',
          'discharge_summary',
          'consultation_note',
          'other',
        ],
        message: 'Invalid record type.',
      },
      default: 'other',
      index: true,
    },
    recordDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
      default: '',
    },
    doctorNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Doctor notes cannot exceed 2000 characters.'],
      default: '',
    },
    ipfsCid: {
      type: String,
      trim: true,
      default: '',
    },
    fileHash: {
      type: String,
      trim: true,
      default: '',
    },
    iv: {
      type: String,
      trim: true,
      default: '',
    },
    authTag: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    authorizedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
)

// Helper method to check if a specific user is authorized to view this record
medicalRecordSchema.methods.isUserAuthorized = function (userId, role) {
  if (!userId) return false
  const uId = userId.toString()

  // Extract patient ID safely (works whether populated or raw ObjectId)
  const patientId = this.patient?._id
    ? this.patient._id.toString()
    : this.patient
      ? this.patient.toString()
      : null

  if (patientId === uId) {
    return true
  }

  // If doctor: check authorizedDoctors array (works whether populated or raw ObjectIds)
  if (role === 'doctor' && Array.isArray(this.authorizedDoctors)) {
    return this.authorizedDoctors.some((doc) => {
      const docId = doc?._id ? doc._id.toString() : doc ? doc.toString() : null
      return docId === uId
    })
  }

  return false
}


const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema)

export default MedicalRecord
