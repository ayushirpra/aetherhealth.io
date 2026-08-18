import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider } from '../context/AuthContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import * as apiModule from '../services/api.js'

// Helper component to inspect auth context
function TestAuthConsumer() {
  const { user, token, isAuthenticated, isPatient, isDoctor, error, login, register, logout } =
    useAuth()

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="user-name">{user?.name || 'none'}</div>
      <div data-testid="user-role">{user?.role || 'none'}</div>
      <div data-testid="token">{token || 'none'}</div>
      <div data-testid="is-patient">{isPatient ? 'yes' : 'no'}</div>
      <div data-testid="is-doctor">{isDoctor ? 'yes' : 'no'}</div>
      <div data-testid="error-msg">{error || 'none'}</div>
      <button
        onClick={() => login({ email: 'test@example.com', password: 'password123' })}
        data-testid="login-btn"
      >
        Login
      </button>
      <button
        onClick={() =>
          register({
            name: 'Dr. House',
            email: 'house@example.com',
            password: 'password123',
            role: 'doctor',
          })
        }
        data-testid="register-btn"
      >
        Register
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  )
}

describe('AuthContext & useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes as unauthenticated when localStorage is empty', async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
      expect(screen.getByTestId('user-name')).toHaveTextContent('none')
    })
  })

  it('successfully logs in, saves session to localStorage, and updates role flags', async () => {
    const mockUser = { _id: 'u123', name: 'Alice Patient', email: 'alice@example.com', role: 'patient' }
    vi.spyOn(apiModule, 'loginUser').mockResolvedValueOnce({
      success: true,
      token: 'mock-jwt-token-xyz',
      user: mockUser,
    })

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    )

    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Alice Patient')
      expect(screen.getByTestId('user-role')).toHaveTextContent('patient')
      expect(screen.getByTestId('is-patient')).toHaveTextContent('yes')
      expect(screen.getByTestId('is-doctor')).toHaveTextContent('no')
      expect(screen.getByTestId('token')).toHaveTextContent('mock-jwt-token-xyz')
      expect(localStorage.getItem('aether_token')).toBe('mock-jwt-token-xyz')
    })
  })

  it('handles login failure and sets error message', async () => {
    vi.spyOn(apiModule, 'loginUser').mockRejectedValueOnce({
      response: { data: { message: 'Invalid email or password.' } },
    })

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    )

    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
      expect(screen.getByTestId('error-msg')).toHaveTextContent('Invalid email or password.')
    })
  })

  it('successfully registers as a doctor and updates context', async () => {
    const mockDoctor = { _id: 'd123', name: 'Dr. House', email: 'house@example.com', role: 'doctor' }
    vi.spyOn(apiModule, 'registerUser').mockResolvedValueOnce({
      success: true,
      token: 'doctor-jwt-token-123',
      user: mockDoctor,
    })

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    )

    await act(async () => {
      screen.getByTestId('register-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Dr. House')
      expect(screen.getByTestId('user-role')).toHaveTextContent('doctor')
      expect(screen.getByTestId('is-doctor')).toHaveTextContent('yes')
      expect(screen.getByTestId('is-patient')).toHaveTextContent('no')
    })
  })

  it('clears session on logout', async () => {
    localStorage.setItem('aether_token', 'sample-token')
    localStorage.setItem('aether_user', JSON.stringify({ name: 'Bob', role: 'patient' }))

    vi.spyOn(apiModule, 'getCurrentUser').mockResolvedValueOnce({
      success: true,
      user: { name: 'Bob', role: 'patient' },
    })

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated')
    expect(localStorage.getItem('aether_token')).toBeNull()
  })

  it('restores and verifies session from localStorage token on mount', async () => {
    localStorage.setItem('aether_token', 'valid-saved-token')
    vi.spyOn(apiModule, 'getCurrentUser').mockResolvedValueOnce({
      success: true,
      user: { _id: 'u999', name: 'Restored User', role: 'patient' },
    })

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Restored User')
    })
  })
})
