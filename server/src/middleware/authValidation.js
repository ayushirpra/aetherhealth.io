import { body, validationResult } from 'express-validator'

/**
 * validate — generic middleware that reads the result of express-validator chains
 * and returns a 422 with all error messages if validation failed.
 */
export function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}

/**
 * registerRules — validation chain for POST /api/auth/register
 */
export const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),

  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn(['patient', 'doctor']).withMessage('Role must be "patient" or "doctor".'),
]

/**
 * loginRules — validation chain for POST /api/auth/login
 */
export const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
]
