import multer from 'multer'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB limit

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'text/plain',
]

// Store files strictly in memory buffer — never write plaintext to disk
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    const error = new Error(
      `Unsupported file type: ${file.mimetype}. Allowed types are PDF, JPEG, PNG, WEBP, TIFF, and TXT.`,
    )
    error.status = 400
    cb(error, false)
  }
}

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
})

/**
 * handleUploadError — Express error middleware for Multer errors
 */
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum allowed file size is 15MB.',
      })
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    })
  }

  if (err && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  next(err)
}
