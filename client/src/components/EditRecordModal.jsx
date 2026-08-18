import { useState, useEffect } from 'react'
import { updateRecord } from '../services/api.js'

const RECORD_TYPES = [
  { id: 'lab_report', label: 'Lab Report', icon: '🧪' },
  { id: 'prescription', label: 'Prescription', icon: '💊' },
  { id: 'radiology', label: 'Radiology', icon: '🩻' },
  { id: 'discharge_summary', label: 'Discharge Summary', icon: '📋' },
  { id: 'consultation_note', label: 'Consultation', icon: '🩺' },
  { id: 'other', label: 'Other', icon: '📄' },
]

export function EditRecordModal({ isOpen, record, onClose, onRecordUpdated }) {
  const [formData, setFormData] = useState({
    title: '',
    recordType: 'other',
    recordDate: '',
    description: '',
    status: 'active',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (record) {
      setFormData({
        title: record.title || '',
        recordType: record.recordType || 'other',
        recordDate: record.recordDate ? new Date(record.recordDate).toISOString().split('T')[0] : '',
        description: record.description || '',
        status: record.status || 'active',
      })
    }
  }, [record])

  if (!isOpen || !record) return null

  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) {
      errors.title = 'Record title cannot be empty.'
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Title must be 200 characters or fewer.'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await updateRecord(record._id, {
        title: formData.title.trim(),
        recordType: formData.recordType,
        recordDate: formData.recordDate ? new Date(formData.recordDate).toISOString() : undefined,
        description: formData.description.trim(),
        status: formData.status,
      })

      if (response.success && response.record) {
        onRecordUpdated(response.record)
        onClose()
      } else {
        throw new Error(response.message || 'Failed to update record.')
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Error updating medical record.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 my-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus-ring"
          aria-label="Close Modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl">
            ✏️
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Edit Medical Record
            </h2>
            <p className="text-xs text-gray-500">
              Update record metadata and status
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="edit-title" className="block text-xs font-semibold text-gray-700 mb-1">
              Record Title *
            </label>
            <input
              id="edit-title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                validationErrors.title ? 'border-red-300 bg-red-50/40' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
            />
            {validationErrors.title && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Record Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RECORD_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, recordType: type.id }))}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all ${
                    formData.recordType === type.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span className="truncate">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-recordDate" className="block text-xs font-semibold text-gray-700 mb-1">
                Date
              </label>
              <input
                id="edit-recordDate"
                name="recordDate"
                type="date"
                value={formData.recordDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="edit-status" className="block text-xs font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                id="edit-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Notes
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm shadow-primary-500/20 disabled:opacity-60 transition-all focus-ring"
            >
              {submitting ? 'Saving Changes...' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditRecordModal
