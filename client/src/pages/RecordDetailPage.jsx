import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getRecord, deleteRecord, authorizeDoctor, revokeDoctor } from '../services/api.js'
import { Navbar } from '../components/Navbar.jsx'
import { EditRecordModal } from '../components/EditRecordModal.jsx'

const TYPE_CONFIG = {
  lab_report: { label: 'Lab Report', icon: '🧪', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' },
  prescription: { label: 'Prescription', icon: '💊', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  radiology: { label: 'Radiology / Scan', icon: '🩻', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  discharge_summary: { label: 'Discharge Summary', icon: '📋', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  consultation_note: { label: 'Consultation Note', icon: '🩺', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  other: { label: 'Medical Document', icon: '📄', badgeClass: 'bg-gray-50 text-gray-700 border-gray-200' },
}

export function RecordDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Doctor authorization form
  const [doctorIdInput, setDoctorIdInput] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [authSuccess, setAuthSuccess] = useState(null)

  const fetchRecord = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRecord(id)
      if (data.success && data.record) {
        setRecord(data.record)
      } else {
        throw new Error('Record could not be loaded.')
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load record.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  const isOwner =
    record &&
    (record.patient?._id === user?._id ||
      record.patient === user?._id ||
      record.patient?._id?.toString() === user?._id?.toString())

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${record?.title}"?`)) {
      return
    }

    try {
      await deleteRecord(record._id)
      navigate('/records', { replace: true })
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to delete record.')
    }
  }

  const handleAuthorizeDoctor = async (e) => {
    e.preventDefault()
    if (!doctorIdInput.trim()) return

    setAuthSubmitting(true)
    setAuthError(null)
    setAuthSuccess(null)

    try {
      const res = await authorizeDoctor(record._id, doctorIdInput.trim())
      if (res.success && res.record) {
        setRecord(res.record)
        setDoctorIdInput('')
        setAuthSuccess('Doctor access granted successfully.')
      }
    } catch (err) {
      setAuthError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Failed to authorize doctor.',
      )
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleRevokeDoctor = async (doctorId) => {
    if (!window.confirm('Revoke access for this clinician?')) return

    try {
      const res = await revokeDoctor(record._id, doctorId)
      if (res.success && res.record) {
        setRecord(res.record)
        setAuthSuccess('Doctor access revoked successfully.')
      }
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to revoke doctor.')
    }
  }

  const typeInfo = record ? TYPE_CONFIG[record.recordType] || TYPE_CONFIG.other : TYPE_CONFIG.other

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/records"
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors"
          >
            ← Back to All Records
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm animate-pulse space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-md mx-auto my-12 shadow-sm">
            <div className="text-3xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Unable to Access Record</h2>
            <p className="text-xs text-red-600 mb-6">{error}</p>
            <Link
              to="/records"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Return to Records List
            </Link>
          </div>
        )}

        {/* Record Content */}
        {!loading && record && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeInfo.badgeClass}`}
                    >
                      <span className="mr-1.5">{typeInfo.icon}</span>
                      {typeInfo.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        record.status === 'archived'
                          ? 'bg-gray-100 text-gray-700 border-gray-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {record.status === 'archived' ? 'Archived' : 'Active'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {record.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 mt-2">
                    <span>
                      📅 Examination Date:{' '}
                      <span className="font-semibold text-gray-700">
                        {record.recordDate
                          ? new Date(record.recordDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </span>
                    {record.patient && (
                      <span>
                        👤 Patient:{' '}
                        <span className="font-semibold text-gray-700">
                          {record.patient.name || record.patient.email || 'Owner'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                  <div className="flex items-center space-x-2.5 self-start sm:self-auto">
                    <button
                      onClick={() => setIsEditOpen(true)}
                      className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus-ring"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors focus-ring"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description & Clinical Observations Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Clinical Summary & Description
                </h2>
                <div className="text-sm text-gray-700 leading-relaxed bg-surface p-4 rounded-xl border border-gray-100">
                  {record.description || (
                    <span className="italic text-gray-400">No description entered.</span>
                  )}
                </div>
              </div>

              {record.doctorNotes && (
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    Attending Clinician / Doctor Remarks
                  </h2>
                  <div className="text-sm text-gray-700 leading-relaxed bg-primary-50/40 p-4 rounded-xl border border-primary-100/60">
                    {record.doctorNotes}
                  </div>
                </div>
              )}
            </div>

            {/* Pipeline Status Cards (IPFS / AI Placeholders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Decentralized Storage Status */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center space-x-2.5 mb-3">
                  <span className="text-xl">📦</span>
                  <h3 className="text-sm font-bold text-gray-900">
                    Decentralized IPFS Storage
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  In Phase 4, document attachments will be AES-encrypted in memory and pinned to IPFS via Pinata.
                </p>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs flex items-center justify-between">
                  <span className="text-gray-500 font-mono">CID Status:</span>
                  <span className="font-semibold text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded">
                    {record.ipfsCid || 'Phase 4 Integration'}
                  </span>
                </div>
              </div>

              {/* AI Analysis Status */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center space-x-2.5 mb-3">
                  <span className="text-xl">🧠</span>
                  <h3 className="text-sm font-bold text-gray-900">
                    AI Extraction & OCR Status
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  In Phase 5, Tesseract OCR and Gemini API will automatically extract lab metrics, abnormal findings, and medication plans.
                </p>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs flex items-center justify-between">
                  <span className="text-gray-500 font-mono">Pipeline Status:</span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Phase 5 Integration
                  </span>
                </div>
              </div>
            </div>

            {/* Doctor Access Management Section (Patient Only) */}
            {isOwner && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Doctor Access Permissions
                    </h2>
                    <p className="text-xs text-gray-500">
                      Control which healthcare providers can review this medical record
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
                    {record.authorizedDoctors?.length || 0} Authorized
                  </span>
                </div>

                {/* Feedback Alerts */}
                {authError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {authError}
                  </div>
                )}
                {authSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                    {authSuccess}
                  </div>
                )}

                {/* List of Authorized Doctors */}
                <div className="mb-6 space-y-2">
                  {record.authorizedDoctors && record.authorizedDoctors.length > 0 ? (
                    record.authorizedDoctors.map((doc) => {
                      const docId = doc._id || doc
                      const docName = doc.name || `Doctor (${docId})`
                      const docEmail = doc.email || ''

                      return (
                        <div
                          key={docId.toString()}
                          className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200/60 text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="text-lg">👨‍⚕️</span>
                            <div>
                              <div className="font-semibold text-gray-900">{docName}</div>
                              {docEmail && <div className="text-gray-500">{docEmail}</div>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevokeDoctor(docId)}
                            className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100/60 rounded-lg transition-colors"
                          >
                            Revoke Access
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400 italic">
                      No doctors currently authorized. This record is private to you.
                    </div>
                  )}
                </div>

                {/* Authorize New Doctor Form */}
                <form onSubmit={handleAuthorizeDoctor} className="flex gap-2">
                  <input
                    type="text"
                    value={doctorIdInput}
                    onChange={(e) => setDoctorIdInput(e.target.value)}
                    placeholder="Enter Doctor MongoDB User ID..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={authSubmitting || !doctorIdInput.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50 transition-all focus-ring shrink-0"
                  >
                    {authSubmitting ? 'Granting...' : 'Grant Access'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <EditRecordModal
        isOpen={isEditOpen}
        record={record}
        onClose={() => setIsEditOpen(false)}
        onRecordUpdated={(updated) => setRecord(updated)}
      />
    </div>
  )
}

export default RecordDetailPage
