import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { getRecords, deleteRecord } from '../services/api.js'
import { Navbar } from '../components/Navbar.jsx'
import { RecordCard } from '../components/RecordCard.jsx'
import { CreateRecordModal } from '../components/CreateRecordModal.jsx'
import { EditRecordModal } from '../components/EditRecordModal.jsx'

const CATEGORY_TABS = [
  { id: 'all', label: 'All Categories' },
  { id: 'lab_report', label: '🧪 Lab Reports' },
  { id: 'prescription', label: '💊 Prescriptions' },
  { id: 'radiology', label: '🩻 Radiology' },
  { id: 'discharge_summary', label: '📋 Discharge' },
  { id: 'consultation_note', label: '🩺 Consultations' },
  { id: 'other', label: '📄 Other' },
]

export function RecordsPage() {
  const { user, isPatient, isDoctor } = useAuth()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('active')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  // Fetch records
  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (selectedType !== 'all') params.recordType = selectedType
      if (selectedStatus !== 'all') params.status = selectedStatus

      const data = await getRecords(params)
      if (data.success && Array.isArray(data.records)) {
        setRecords(data.records)
      } else {
        setRecords([])
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch medical records.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedStatus])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Delete handler
  const handleDelete = async (recordId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return
    }

    try {
      await deleteRecord(recordId)
      setRecords((prev) => prev.filter((r) => r._id !== recordId))
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to delete record.')
    }
  }

  // Filtered by search query locally
  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.patient?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isDoctor
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}
              >
                {isDoctor ? 'Doctor Access View' : 'Patient Vault'}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {filteredRecords.length} {filteredRecords.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {isDoctor ? 'Authorized Patient Records' : 'My Medical Records'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isPatient
                ? 'Store, manage, and grant granular permissions for your medical documents.'
                : 'Review patient records that have explicitly authorized your access.'}
            </p>
          </div>

          {/* Patient Action: Upload / New Record */}
          {isPatient && (
            <div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary-500/20 transition-all focus-ring"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Record
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by title or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <label htmlFor="status-select" className="text-xs text-gray-500 font-medium">
                Status:
              </label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active Only</option>
                <option value="archived">Archived</option>
                <option value="all">All Records</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-gray-50">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedType === tab.id
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchRecords} className="underline text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded-full w-24 mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-16 bg-gray-50 rounded mb-4" />
                <div className="h-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRecords.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm max-w-lg mx-auto my-6">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              📂
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              No medical records found
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              {searchQuery || selectedType !== 'all'
                ? 'Try adjusting your filters or search terms to see matching medical records.'
                : isPatient
                ? 'You haven’t added any medical documents yet. Upload a lab report or prescription to get started.'
                : 'No patients have granted authorization to their medical records yet.'}
            </p>
            {isPatient && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm focus-ring"
              >
                + Add First Medical Record
              </button>
            )}
          </div>
        )}

        {/* Records Grid */}
        {!loading && filteredRecords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecords.map((record) => (
              <RecordCard
                key={record._id}
                record={record}
                isOwner={record.patient?._id === user?._id || record.patient === user?._id}
                onEdit={(rec) => setEditingRecord(rec)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateRecordModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onRecordCreated={(newRec) => {
          setRecords((prev) => [newRec, ...prev])
        }}
      />

      <EditRecordModal
        isOpen={Boolean(editingRecord)}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onRecordUpdated={(updatedRec) => {
          setRecords((prev) =>
            prev.map((r) => (r._id === updatedRec._id ? updatedRec : r)),
          )
        }}
      />
    </div>
  )
}

export default RecordsPage
