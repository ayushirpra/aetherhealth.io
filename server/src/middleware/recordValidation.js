import { body } from 'express-validator'

const VALID_RECORD_TYPES = [
  'lab_report',
  'prescription',
  'radiology',
  'discharge_summary',
  'consultation_note',
  'other',
]

/**
 * createRecordRules — validation chain for POST /api/records
 */
export const createRecordRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Record title is required.')
    .isLength({ max: 200 })
    .withMessage('Record title cannot exceed 200 characters.'),

  body('recordType')
    .optional()
    .isIn(VALID_RECORD_TYPES)
    .withMessage(`Record type must be one of: ${VALID_RECORD_TYPES.join(', ')}.`),

  body('recordDate')
    .optional()
    .isISO8601()
    .withMessage('Record date must be a valid ISO8601 date string.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),
]

/**
 * updateRecordRules — validation chain for PUT /api/records/:id
 */
export const updateRecordRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Record title cannot be empty.')
    .isLength({ max: 200 })
    .withMessage('Record title cannot exceed 200 characters.'),

  body('recordType')
    .optional()
    .isIn(VALID_RECORD_TYPES)
    .withMessage(`Record type must be one of: ${VALID_RECORD_TYPES.join(', ')}.`),

  body('recordDate')
    .optional()
    .isISO8601()
    .withMessage('Record date must be a valid ISO8601 date string.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('status')
    .optional()
    .isIn(['active', 'archived'])
    .withMessage('Status must be either "active" or "archived".'),
]

/**
 * doctorAccessRules — validation chain for authorizing/revoking doctor access
 */
export const doctorAccessRules = [
  body('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required.')
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ObjectId.'),
]
