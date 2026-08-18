import * as recordService from '../services/recordService.js'

/**
 * create — POST /api/records
 */
export async function create(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only patients can create medical records.',
      })
    }

    const record = await recordService.createRecord(req.user._id, req.body)
    res.status(201).json({
      success: true,
      message: 'Medical record created successfully.',
      record,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * list — GET /api/records
 */
export async function list(req, res, next) {
  try {
    const records = await recordService.listRecords(req.user, req.query)
    res.status(200).json({
      success: true,
      count: records.length,
      records,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * getById — GET /api/records/:id
 */
export async function getById(req, res, next) {
  try {
    const record = await recordService.getRecordById(req.params.id, req.user)
    res.status(200).json({
      success: true,
      record,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * update — PUT /api/records/:id
 */
export async function update(req, res, next) {
  try {
    const record = await recordService.updateRecord(req.params.id, req.user, req.body)
    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully.',
      record,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * remove — DELETE /api/records/:id
 */
export async function remove(req, res, next) {
  try {
    const result = await recordService.deleteRecord(req.params.id, req.user)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * createWithFile — POST /api/records/upload
 */
export async function createWithFile(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only patients can create medical records.',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Medical document file is required.',
      })
    }

    const record = await recordService.createRecordWithFile(
      req.user._id,
      req.body,
      req.file.buffer,
      {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    )

    res.status(201).json({
      success: true,
      message: 'Medical record encrypted and pinned to IPFS successfully.',
      record,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * uploadAttachment — POST /api/records/:id/attachment
 */
export async function uploadAttachment(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only patients can upload medical files.',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Medical document file is required.',
      })
    }

    const record = await recordService.attachFileToRecord(
      req.params.id,
      req.user,
      req.file.buffer,
      {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    )

    res.status(200).json({
      success: true,
      message: 'File encrypted and attached to record successfully.',
      record,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * downloadFile — GET /api/records/:id/download
 */
export async function downloadFile(req, res, next) {
  try {
    const fileData = await recordService.downloadRecordFile(req.params.id, req.user)

    res.setHeader('Content-Type', fileData.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.fileName}"`)
    res.setHeader('Content-Length', fileData.buffer.length)
    res.setHeader('x-ipfs-cid', fileData.ipfsCid)
    res.setHeader('x-file-hash', fileData.fileHash)

    return res.status(200).send(fileData.buffer)
  } catch (err) {
    next(err)
  }
}

/**
 * verifyIntegrity — GET /api/records/:id/verify
 */
export async function verifyIntegrity(req, res, next) {
  try {
    const result = await recordService.verifyRecordIntegrity(req.params.id, req.user)
    res.status(200).json({
      success: true,
      message: 'File integrity verified. Decrypted SHA-256 hash matches recorded digest.',
      ...result,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * authorizeDoctor — POST /api/records/:id/authorize
 */
export async function authorizeDoctor(req, res, next) {
  try {
    const record = await recordService.authorizeDoctor(
      req.params.id,
      req.user._id,
      req.body.doctorId,
    )
    res.status(200).json({
      success: true,
      message: 'Doctor access granted successfully.',
      record,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * revokeDoctor — POST /api/records/:id/revoke
 */
export async function revokeDoctor(req, res, next) {
  try {
    const record = await recordService.revokeDoctor(
      req.params.id,
      req.user._id,
      req.body.doctorId,
    )
    res.status(200).json({
      success: true,
      message: 'Doctor access revoked successfully.',
      record,
    })
  } catch (err) {
    next(err)
  }
}

