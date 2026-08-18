/**
 * HomePage — Phase 1 placeholder.
 * Will be replaced with the Patient/Doctor dashboard in Phase 3+.
 */
function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-600 text-white px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Aether<span className="text-secondary-400">Health</span>
        </h1>
        <p className="text-lg text-indigo-200 mb-8">
          Secure, patient-controlled medical records powered by decentralized
          storage, blockchain auditability, and AI-assisted analysis.
        </p>
        <span className="inline-block px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium backdrop-blur">
          🚧 Phase 1 — Foundation scaffold
        </span>
      </div>
    </main>
  )
}

export default HomePage
