import { Router } from 'express'
import * as recordController from '../controllers/recordController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/authValidation.js'
import { upload, handleUploadError } from '../middleware/fileUpload.js'
import {
  createRecordRules,
  updateRecordRules,
  doctorAccessRules,
} from '../middleware/recordValidation.js'

const router = Router()

// All medical record routes require an authenticated user
router.use(authMiddleware)

/**
 * POST /api/records — Create a new medical record metadata (Patient only)
 */
router.post('/', createRecordRules, validate, recordController.create)

/**
 * POST /api/records/upload — Create record with encrypted IPFS file upload (Patient only)
 */
router.post(
  '/upload',
  upload.single('file'),
  handleUploadError,
  createRecordRules,
  validate,
  recordController.createWithFile,
)

/**
 * POST /api/records/:id/attachment — Encrypt and attach file to existing record (Patient only)
 */
router.post(
  '/:id/attachment',
  upload.single('file'),
  handleUploadError,
  recordController.uploadAttachment,
)

/**
 * GET /api/records — List medical records accessible to the user
 */
router.get('/', recordController.list)

/**
 * GET /api/records/:id — Get a single medical record
 */
router.get('/:id', recordController.getById)

/**
 * GET /api/records/:id/download — Download and decrypt medical record file from IPFS
 */
router.get('/:id/download', recordController.downloadFile)

/**
 * GET /api/records/:id/verify — Verify integrity of the IPFS file against SHA-256 digest
 */
router.get('/:id/verify', recordController.verifyIntegrity)

/**
 * PUT /api/records/:id — Update medical record metadata (Owner only)
 */
router.put('/:id', updateRecordRules, validate, recordController.update)

/**
 * DELETE /api/records/:id — Delete medical record (Owner only)
 */
router.delete('/:id', recordController.remove)

/**
 * POST /api/records/:id/authorize — Authorize a doctor to view this record (Owner only)
 */
router.post('/:id/authorize', doctorAccessRules, validate, recordController.authorizeDoctor)

/**
 * POST /api/records/:id/revoke — Revoke a doctor's access to this record (Owner only)
 */
router.post('/:id/revoke', doctorAccessRules, validate, recordController.revokeDoctor)

export default router

