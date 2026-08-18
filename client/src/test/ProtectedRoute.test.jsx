import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute.jsx'
import * as useAuthHook from '../hooks/useAuth.js'

describe('ProtectedRoute', () => {
  it('shows loading spinner when authentication check is in progress', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText(/verifying session/i)).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Target</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login Page Target')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated and no role restrictions', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { name: 'Alice', role: 'patient' },
      isAuthenticated: true,
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Secret Medical Dashboard</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Secret Medical Dashboard')).toBeInTheDocument()
  })

  it('blocks access and displays restricted notice when role does not match', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { name: 'Alice Patient', role: 'patient' },
      isAuthenticated: true,
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/doctor-panel']}>
        <ProtectedRoute allowedRoles={['doctor']}>
          <div>Doctor Exclusive Tools</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText(/access restricted/i)).toBeInTheDocument()
    expect(screen.getByText(/doctor accounts only/i)).toBeInTheDocument()
    expect(screen.queryByText('Doctor Exclusive Tools')).not.toBeInTheDocument()
  })
})
