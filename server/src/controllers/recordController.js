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
