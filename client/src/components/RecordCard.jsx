import { Link } from 'react-router-dom'

const TYPE_CONFIG = {
  lab_report: {
    label: 'Lab Report',
    icon: '🧪',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  prescription: {
    label: 'Prescription',
    icon: '💊',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  radiology: {
    label: 'Radiology / Scan',
    icon: '🩻',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  discharge_summary: {
    label: 'Discharge Summary',
    icon: '📋',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  consultation_note: {
    label: 'Consultation Note',
    icon: '🩺',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  other: {
    label: 'Medical Document',
    icon: '📄',
    badgeClass: 'bg-gray-50 text-gray-700 border-gray-200',
  },
}

export function RecordCard({ record, isOwner, onEdit, onDelete }) {
  const typeInfo = TYPE_CONFIG[record.recordType] || TYPE_CONFIG.other

  const formattedDate = record.recordDate
    ? new Date(record.recordDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No Date'

  const authorizedCount = record.authorizedDoctors?.length || 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Card Header: Type Badge & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeInfo.badgeClass}`}
          >
            <span className="mr-1.5">{typeInfo.icon}</span>
            {typeInfo.label}
          </span>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              record.status === 'archived'
                ? 'bg-gray-100 text-gray-600 border-gray-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                record.status === 'archived' ? 'bg-gray-400' : 'bg-emerald-500'
              }`}
            />
            {record.status === 'archived' ? 'Archived' : 'Active'}
          </span>
        </div>

        {/* Title & Date */}
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
          <Link to={`/records/${record._id}`}>{record.title}</Link>
        </h3>

        <div className="flex items-center text-xs text-gray-400 mb-3 space-x-2">
          <span>📅 {formattedDate}</span>
          {record.patient?.name && (
            <>
              <span>•</span>
              <span className="text-gray-600 font-medium">👤 {record.patient.name}</span>
            </>
          )}
        </div>

        {/* Description snippet */}
        {record.description ? (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
            {record.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic mb-4">No description provided.</p>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        {/* Doctor Authorization indicator */}
        <div className="text-xs text-gray-500 flex items-center">
          {authorizedCount > 0 ? (
            <span className="inline-flex items-center text-primary-700 font-medium bg-primary-50 px-2 py-0.5 rounded-md">
              👨‍⚕️ {authorizedCount} {authorizedCount === 1 ? 'Doctor' : 'Doctors'}
            </span>
          ) : (
            <span className="text-gray-400 flex items-center">
              🔒 <span className="ml-1">Patient Only</span>
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2">
          {isOwner && onEdit && (
            <button
              onClick={() => onEdit(record)}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors focus-ring"
              title="Edit Record"
              aria-label="Edit Record"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(record._id, record.title)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-ring"
              title="Delete Record"
              aria-label="Delete Record"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          <Link
            to={`/records/${record._id}`}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RecordCard
