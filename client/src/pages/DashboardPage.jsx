import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { Navbar } from '../components/Navbar.jsx'

export function DashboardPage() {
  const { user, isPatient, isDoctor } = useAuth()

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    isDoctor
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  {isDoctor ? '👨‍⚕️ Clinician / Doctor Portal' : '👤 Patient Health Vault'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Authenticated Session
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isPatient
                  ? 'Manage your decentralized medical records, granular sharing permissions, and AI health summaries.'
                  : 'Access authorized patient medical records and audit permissions.'}
              </p>
            </div>

            {/* Quick Profile Summary Card */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60 min-w-[220px]">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                Session Info
              </div>
              <div className="text-sm font-semibold text-gray-800 truncate">{user?.email}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                <span>Account ID:</span>
                <span className="font-mono text-gray-600 bg-gray-200/70 px-1.5 py-0.5 rounded">
                  {user?._id?.slice(-8) || 'Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role-Specific Overview Grid */}
        {isPatient && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              to="/records"
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group block"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                My Medical Records →
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                View, upload, search, and manage permissions for all your clinical reports.
              </p>
              <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                Phase 3 Live
              </div>
            </Link>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Doctor Access Control</h3>
              <p className="text-sm text-gray-500 mb-4">
                Grant, review, or revoke time-bound access to verified clinicians.
              </p>
              <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
                Phase 6 Feature
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">OCR & AI Health Extraction</h3>
              <p className="text-sm text-gray-500 mb-4">
                Automatic recognition of medicines, abnormal lab tests, and disease summaries.
              </p>
              <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                Phase 5 Feature
              </div>
            </div>
          </div>
        )}

        {isDoctor && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              to="/records"
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group block"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                Authorized Patients →
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                View records from patients who have explicitly granted you clinical review access.
              </p>
              <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                Phase 3 Live
              </div>
            </Link>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Request Record Access</h3>
              <p className="text-sm text-gray-500 mb-4">
                Send time-bound record access requests directly to patients for approval.
              </p>
              <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
                Phase 6 Feature
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Blockchain Verification</h3>
              <p className="text-sm text-gray-500 mb-4">
                Verify report tamper status & audit permission on the Polygon Amoy blockchain.
              </p>
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Phase 7 Feature
              </div>
            </div>
          </div>
        )}

        {/* Authentication Security Notice */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-2">
            🔐 Authentication Security Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 mt-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="font-semibold text-gray-900 mb-0.5">JWT Session</div>
              <div>Signed & Verified Server-side</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="font-semibold text-gray-900 mb-0.5">Password Protection</div>
              <div>bcrypt Salted Hashing</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="font-semibold text-gray-900 mb-0.5">Authorization Model</div>
              <div>Role-Based Access Control</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="font-semibold text-gray-900 mb-0.5">Token Interception</div>
              <div>Axios Auto-Attached Bearer</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
