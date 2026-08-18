import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { Navbar } from '../components/Navbar.jsx'

export function HomePage() {
  const { isAuthenticated, isDoctor } = useAuth()

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
            <span>Decentralized Healthcare Protocol</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight sm:leading-none mb-6">
            Patient-Owned Records. <br />
            <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              Cryptographically Verified.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            AetherHealth unifies decentralized encrypted storage, blockchain audit trails,
            and AI medical report analysis under sovereign patient control.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all focus-ring text-base"
              >
                Go to {isDoctor ? 'Doctor' : 'Patient'} Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all focus-ring text-base"
                >
                  Create Patient or Doctor Account →
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all focus-ring text-base"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Encrypted Decentralization</h3>
            <p className="text-xs text-gray-500">
              Files are AES-encrypted before being stored on IPFS. No centralized server or database holds raw files.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Time-Bound Permissions</h3>
            <p className="text-xs text-gray-500">
              Patients approve doctor requests with explicit expiration. Access can be revoked instantly at any time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">OCR & AI Analysis</h3>
            <p className="text-xs text-gray-500">
              Tesseract and Gemini extract lab values, medicines, and medical summaries while preserving raw inputs.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400 bg-white">
        AetherHealth © 2026 — Sovereign Patient Data & Blockchain Auditability
      </footer>
    </div>
  )
}

export default HomePage
