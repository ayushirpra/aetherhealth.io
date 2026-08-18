import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage.jsx'
import { RegisterPage } from '../pages/RegisterPage.jsx'
import * as useAuthHook from '../hooks/useAuth.js'

describe('Auth Pages (Login & Register)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LoginPage', () => {
    it('renders login fields and validates required inputs on submit', async () => {
      const mockLogin = vi.fn()
      vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        error: null,
        clearError: vi.fn(),
      })

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()

      // Submit without entering values
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('submits valid credentials and calls auth.login', async () => {
      const mockLogin = vi.fn().mockResolvedValue({ success: true })
      vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        error: null,
        clearError: vi.fn(),
      })

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'patient@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'patient@example.com',
          password: 'password123',
        })
      })
    })

    it('displays server error banner when auth error exists', () => {
      vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
        login: vi.fn(),
        isAuthenticated: false,
        error: 'Invalid email or password.',
        clearError: vi.fn(),
      })

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )

      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
    })
  })

  describe('RegisterPage', () => {
    it('renders role selectors (Patient vs Doctor) and validates inputs', async () => {
      const mockRegister = vi.fn()
      vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
        register: mockRegister,
        isAuthenticated: false,
        error: null,
        clearError: vi.fn(),
      })

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()
      expect(screen.getByText('Patient')).toBeInTheDocument()
      expect(screen.getByText('Doctor')).toBeInTheDocument()

      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /register as patient/i }))

      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('switches role to Doctor and submits valid registration', async () => {
      const mockRegister = vi.fn().mockResolvedValue({ success: true })
      vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
        register: mockRegister,
        isAuthenticated: false,
        error: null,
        clearError: vi.fn(),
      })

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      )

      // Switch to Doctor role
      fireEvent.click(screen.getByText('Doctor'))

      expect(screen.getByRole('button', { name: /register as doctor/i })).toBeInTheDocument()

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Dr. Gregory House' },
      })
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'drhouse@hospital.org' },
      })
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'securePass123' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'securePass123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /register as doctor/i }))

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Dr. Gregory House',
          email: 'drhouse@hospital.org',
          password: 'securePass123',
          role: 'doctor',
        })
      })
    })

    it('validates password mismatch during registration', async () => {
      const mockRegister = vi.fn()
      vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
        register: mockRegister,
        isAuthenticated: false,
        error: null,
        clearError: vi.fn(),
      })

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Alice Smith' },
      })
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'alice@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'password123' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'passwordXYZ' },
      })

      fireEvent.click(screen.getByRole('button', { name: /register as patient/i }))

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      expect(mockRegister).not.toHaveBeenCalled()
    })
  })
})
