import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecordsPage } from '../pages/RecordsPage.jsx'
import * as apiModule from '../services/api.js'
import * as useAuthHook from '../hooks/useAuth.js'

const mockRecords = [
  {
    _id: 'rec1',
    title: 'Lipid Blood Test',
    recordType: 'lab_report',
    recordDate: '2026-08-15T00:00:00.000Z',
    description: 'Cholesterol levels within normal range.',
    status: 'active',
    patient: { _id: 'p1', name: 'Alice Patient', email: 'alice@test.com' },
    authorizedDoctors: [{ _id: 'd1', name: 'Dr. House' }],
  },
  {
    _id: 'rec2',
    title: 'Chest X-Ray',
    recordType: 'radiology',
    recordDate: '2026-08-10T00:00:00.000Z',
    description: 'Lungs clear.',
    status: 'active',
    patient: { _id: 'p1', name: 'Alice Patient', email: 'alice@test.com' },
    authorizedDoctors: [],
  },
]

describe('RecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { _id: 'p1', name: 'Alice Patient', role: 'patient' },
      isPatient: true,
      isDoctor: false,
      isAuthenticated: true,
      logout: vi.fn(),
    })
  })

  it('renders records list for authenticated patient and displays cards', async () => {
    vi.spyOn(apiModule, 'getRecords').mockResolvedValueOnce({
      success: true,
      count: 2,
      records: mockRecords,
    })

    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /my medical records/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new record/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Lipid Blood Test')).toBeInTheDocument()
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument()
    })
  })

  it('filters records by search query input', async () => {
    vi.spyOn(apiModule, 'getRecords').mockResolvedValueOnce({
      success: true,
      count: 2,
      records: mockRecords,
    })

    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Lipid Blood Test')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search by title/i)
    fireEvent.change(searchInput, { target: { value: 'X-Ray' } })

    expect(screen.queryByText('Lipid Blood Test')).not.toBeInTheDocument()
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument()
  })

  it('allows a patient to open CreateRecordModal and submit a new record', async () => {
    vi.spyOn(apiModule, 'getRecords').mockResolvedValueOnce({
      success: true,
      count: 2,
      records: mockRecords,
    })

    const newRecord = {
      _id: 'rec3',
      title: 'MRI Brain Scan',
      recordType: 'radiology',
      recordDate: '2026-08-18T00:00:00.000Z',
      description: 'Normal findings.',
      status: 'active',
      patient: { _id: 'p1', name: 'Alice Patient' },
      authorizedDoctors: [],
    }

    const createSpy = vi.spyOn(apiModule, 'createRecord').mockResolvedValueOnce({
      success: true,
      record: newRecord,
    })

    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Lipid Blood Test')).toBeInTheDocument()
    })

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /new record/i }))

    expect(screen.getByRole('heading', { name: /add medical record/i })).toBeInTheDocument()

    // Fill form
    fireEvent.change(screen.getByLabelText(/record title \*/i), {
      target: { value: 'MRI Brain Scan' },
    })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /save medical record/i }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled()
      expect(screen.getByText('MRI Brain Scan')).toBeInTheDocument()
    })
  })

  it('renders doctor view without the New Record button', async () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { _id: 'd1', name: 'Dr. House', role: 'doctor' },
      isPatient: false,
      isDoctor: true,
      isAuthenticated: true,
      logout: vi.fn(),
    })

    vi.spyOn(apiModule, 'getRecords').mockResolvedValueOnce({
      success: true,
      count: 1,
      records: [mockRecords[0]],
    })

    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /authorized patient records/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /new record/i })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Lipid Blood Test')).toBeInTheDocument()
    })
  })

  it('handles record deletion when confirmed', async () => {
    vi.spyOn(apiModule, 'getRecords').mockResolvedValueOnce({
      success: true,
      count: 2,
      records: mockRecords,
    })

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const deleteSpy = vi.spyOn(apiModule, 'deleteRecord').mockResolvedValueOnce({
      success: true,
    })

    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Lipid Blood Test')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete record/i })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('rec1')
      expect(screen.queryByText('Lipid Blood Test')).not.toBeInTheDocument()
    })
  })
})
