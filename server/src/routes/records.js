import { Router } from 'express'
import * as recordController from '../controllers/recordController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/authValidation.js'
import {
  createRecordRules,
  updateRecordRules,
  doctorAccessRules,
} from '../middleware/recordValidation.js'

const router = Router()

// All medical record routes require an authenticated user
router.use(authMiddleware)

/**
 * POST /api/records — Create a new medical record (Patient only)
 */
router.post('/', createRecordRules, validate, recordController.create)

/**
 * GET /api/records — List medical records accessible to the user
 */
router.get('/', recordController.list)

/**
 * GET /api/records/:id — Get a single medical record
 */
router.get('/:id', recordController.getById)

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
