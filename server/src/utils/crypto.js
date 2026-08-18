import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes IV for AES-GCM

/**
 * getEncryptionKey — derives or formats a 32-byte key from ENCRYPTION_KEY env var.
 */
export function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY || 'default_test_encryption_key_32_bytes_long_secret'
  // Always derive a clean 32-byte (256-bit) buffer using SHA-256 to ensure exact length
  return crypto.createHash('sha256').update(rawKey).digest()
}

/**
 * computeHash — computes the SHA-256 hex digest of a buffer.
 * @param {Buffer} buffer
 * @returns {string} SHA-256 hex string
 */
export function computeHash(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer)
  }
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * encryptBuffer — encrypts a plaintext buffer using AES-256-GCM.
 * @param {Buffer} buffer — Plaintext data
 * @returns {{ encryptedBuffer: Buffer, iv: string, authTag: string }}
 */
export function encryptBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer)
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encryptedBuffer,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

/**
 * decryptBuffer — decrypts an AES-256-GCM ciphertext buffer.
 * @param {Buffer} encryptedBuffer — Ciphertext data
 * @param {string} ivHex — Hex encoded IV
 * @param {string} authTagHex — Hex encoded authentication tag
 * @returns {Buffer} Decrypted plaintext buffer
 */
export function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
  if (!Buffer.isBuffer(encryptedBuffer)) {
    encryptedBuffer = Buffer.from(encryptedBuffer)
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])
  return decrypted
}
