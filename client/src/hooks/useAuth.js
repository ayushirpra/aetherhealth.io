import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

/**
 * useAuth — custom hook to access authentication state and methods.
 * Throws an error if used outside an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth
