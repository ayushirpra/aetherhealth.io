/**
 * NotFoundPage — 404 fallback.
 */
function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-surface text-gray-900 px-4">
      <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found.</p>
      <a
        href="/"
        className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors focus-ring"
      >
        Go home
      </a>
    </main>
  )
}

export default NotFoundPage
