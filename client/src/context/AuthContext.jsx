import { createContext, useState, useEffect, useCallback } from 'react'
import { loginUser as apiLogin, registerUser as apiRegister, getCurrentUser } from '../services/api.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('aether_token'))
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('aether_user')
    if (!cached) return null
    try {
      return JSON.parse(cached)
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Restore & Verify Session on Mount ─────────────────────────────────────────
  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('aether_token')
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const data = await getCurrentUser()
        if (data.success && data.user) {
          setUser(data.user)
          localStorage.setItem('aether_user', JSON.stringify(data.user))
        } else {
          // Token invalid or user not found
          localStorage.removeItem('aether_token')
          localStorage.removeItem('aether_user')
          setToken(null)
          setUser(null)
        }
      } catch (err) {
        console.warn('Session verification failed:', err?.response?.data?.message || err.message)
        localStorage.removeItem('aether_token')
        localStorage.removeItem('aether_user')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [])

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setError(null)
    try {
      const data = await apiLogin({ email, password })
      if (data.success && data.token && data.user) {
        localStorage.setItem('aether_token', data.token)
        localStorage.setItem('aether_user', JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
        return { success: true, user: data.user }
      }
      throw new Error(data.message || 'Login failed.')
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Failed to log in. Please check your credentials.'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  // ── Register ────────────────────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password, role }) => {
    setError(null)
    try {
      const data = await apiRegister({ name, email, password, role })
      if (data.success && data.token && data.user) {
        localStorage.setItem('aether_token', data.token)
        localStorage.setItem('aether_user', JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
        return { success: true, user: data.user }
      }
      throw new Error(data.message || 'Registration failed.')
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Registration failed. Please try again.'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('aether_token')
    localStorage.removeItem('aether_user')
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: Boolean(user && token),
    isPatient: user?.role === 'patient',
    isDoctor: user?.role === 'doctor',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
