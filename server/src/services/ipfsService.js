/**
 * ipfsService.js — Pinata IPFS integration for encrypted decentralized storage.
 *
 * Medical files are ALWAYS AES-encrypted BEFORE being passed to this service.
 * Plaintext files are NEVER transmitted to IPFS.
 */

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const DEFAULT_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
]

/**
 * pinFileToIPFS — pins an encrypted file buffer to IPFS via Pinata.
 * @param {Buffer} encryptedBuffer - Ciphertext data
 * @param {string} fileName - Safe filename for metadata (e.g. encrypted_report.enc)
 * @param {object} customMetadata - Key-value metadata tags
 * @returns {Promise<{ ipfsCid: string, pinSize: number, timestamp: string }>}
 */
export async function pinFileToIPFS(encryptedBuffer, fileName = 'encrypted_file.enc', customMetadata = {}) {
  const pinataJwt = process.env.PINATA_JWT
  const pinataApiKey = process.env.PINATA_API_KEY
  const pinataSecretKey = process.env.PINATA_SECRET_API_KEY

  if (!pinataJwt && (!pinataApiKey || !pinataSecretKey)) {
    throw new Error('Pinata credentials not configured. Please set PINATA_JWT or API keys in .env.')
  }

  const formData = new FormData()
  const blob = new Blob([encryptedBuffer], { type: 'application/octet-stream' })
  formData.append('file', blob, fileName)

  const metadata = JSON.stringify({
    name: fileName,
    keyvalues: {
      platform: 'AetherHealth',
      encrypted: 'true',
      algorithm: 'aes-256-gcm',
      ...customMetadata,
    },
  })
  formData.append('pinataMetadata', metadata)

  const pinataOptions = JSON.stringify({
    cidVersion: 1,
  })
  formData.append('pinataOptions', pinataOptions)

  const headers = {}
  if (pinataJwt) {
    headers['Authorization'] = `Bearer ${pinataJwt}`
  } else {
    headers['pinata_api_key'] = pinataApiKey
    headers['pinata_secret_api_key'] = pinataSecretKey
  }

  const response = await fetch(PINATA_API_URL, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Pinata upload failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return {
    ipfsCid: data.IpfsHash,
    pinSize: data.PinSize,
    timestamp: data.Timestamp,
  }
}

/**
 * fetchFromIPFS — retrieves encrypted ciphertext buffer from IPFS by CID.
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<Buffer>} Ciphertext buffer
 */
export async function fetchFromIPFS(cid) {
  if (!cid) {
    throw new Error('IPFS CID is required to fetch file.')
  }

  let lastError = null

  // Try configured gateways in order
  for (const gateway of DEFAULT_GATEWAYS) {
    try {
      const url = `${gateway}${cid}`
      const headers = {}
      if (process.env.PINATA_GATEWAY_KEY) {
        headers['x-pinata-gateway-token'] = process.env.PINATA_GATEWAY_KEY
      }

      const response = await fetch(url, { headers })
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(`Failed to fetch file from IPFS for CID ${cid}: ${lastError?.message || 'Gateway unreachable'}`)
}
