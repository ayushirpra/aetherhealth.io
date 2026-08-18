import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RecordDetailPage } from '../pages/RecordDetailPage.jsx'
import * as apiModule from '../services/api.js'
import * as useAuthHook from '../hooks/useAuth.js'

const mockRecord = {
  _id: 'rec100',
  title: 'Full Metabolic Panel',
  recordType: 'lab_report',
  recordDate: '2026-08-15T00:00:00.000Z',
  description: 'Glucose and electrolyte measurements.',
  doctorNotes: 'Maintain hydration and current diet.',
  status: 'active',
  patient: { _id: 'p1', name: 'Alice Patient', email: 'alice@test.com' },
  authorizedDoctors: [
    { _id: 'doc1', name: 'Dr. Gregory House', email: 'house@hospital.org' },
  ],
}

describe('RecordDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders record details and owner actions when user is the patient owner', async () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { _id: 'p1', name: 'Alice Patient', role: 'patient' },
      isAuthenticated: true,
    })

    vi.spyOn(apiModule, 'getRecord').mockResolvedValueOnce({
      success: true,
      record: mockRecord,
    })

    render(
      <MemoryRouter initialEntries={['/records/rec100']}>
        <Routes>
          <Route path="/records/:id" element={<RecordDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Full Metabolic Panel' })).toBeInTheDocument()
      expect(screen.getByText(/glucose and electrolyte measurements/i)).toBeInTheDocument()
      expect(screen.getByText(/maintain hydration/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      expect(screen.getByText('Dr. Gregory House')).toBeInTheDocument()
    })
  })

  it('allows owner to grant access to a doctor by ID', async () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { _id: 'p1', name: 'Alice Patient', role: 'patient' },
      isAuthenticated: true,
    })

    vi.spyOn(apiModule, 'getRecord').mockResolvedValueOnce({
      success: true,
      record: mockRecord,
    })

    const updatedRecord = {
      ...mockRecord,
      authorizedDoctors: [
        ...mockRecord.authorizedDoctors,
        { _id: 'doc2', name: 'Dr. Strange', email: 'strange@hospital.org' },
      ],
    }

    const authSpy = vi.spyOn(apiModule, 'authorizeDoctor').mockResolvedValueOnce({
      success: true,
      record: updatedRecord,
    })

    render(
      <MemoryRouter initialEntries={['/records/rec100']}>
        <Routes>
          <Route path="/records/:id" element={<RecordDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Full Metabolic Panel' })).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/enter doctor mongodb user id/i)
    fireEvent.change(input, { target: { value: 'doc2' } })

    fireEvent.click(screen.getByRole('button', { name: /grant access/i }))

    await waitFor(() => {
      expect(authSpy).toHaveBeenCalledWith('rec100', 'doc2')
      expect(screen.getByText(/doctor access granted successfully/i)).toBeInTheDocument()
    })
  })

  it('allows owner to revoke doctor access', async () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { _id: 'p1', name: 'Alice Patient', role: 'patient' },
      isAuthenticated: true,
    })

    vi.spyOn(apiModule, 'getRecord').mockResolvedValueOnce({
      success: true,
      record: mockRecord,
    })

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const revokedRecord = {
      ...mockRecord,
      authorizedDoctors: [],
    }

    const revokeSpy = vi.spyOn(apiModule, 'revokeDoctor').mockResolvedValueOnce({
      success: true,
      record: revokedRecord,
    })

    render(
      <MemoryRouter initialEntries={['/records/rec100']}>
        <Routes>
          <Route path="/records/:id" element={<RecordDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Dr. Gregory House')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /revoke access/i }))

    await waitFor(() => {
      expect(revokeSpy).toHaveBeenCalledWith('rec100', 'doc1')
      expect(screen.getByText(/doctor access revoked successfully/i)).toBeInTheDocument()
    })
  })

  it('hides owner-specific edit/delete/authorization controls when doctor is viewing', async () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { _id: 'doc1', name: 'Dr. Gregory House', role: 'doctor' },
      isAuthenticated: true,
    })

    vi.spyOn(apiModule, 'getRecord').mockResolvedValueOnce({
      success: true,
      record: mockRecord,
    })

    render(
      <MemoryRouter initialEntries={['/records/rec100']}>
        <Routes>
          <Route path="/records/:id" element={<RecordDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Full Metabolic Panel' })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /grant access/i })).not.toBeInTheDocument()
  })
})
