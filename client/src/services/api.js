import axios from 'axios'

/**
 * api — configured Axios instance for AetherHealth backend API.
 * Uses relative /api which Vite dev proxy and production reverse-proxies map to backend.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor: attach JWT token if present ───────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aether_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response Interceptor: handle global auth failures ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If a protected route returns 401 (excluding login/register attempts), clear token
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register')
    ) {
      localStorage.removeItem('aether_token')
      localStorage.removeItem('aether_user')
    }
    return Promise.reject(error)
  },
)

// ── Auth API Functions ─────────────────────────────────────────────────────────

export async function loginUser(credentials) {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

export async function registerUser(userData) {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me')
  return response.data
}

// ── Medical Records API Functions (Phase 3) ───────────────────────────────────

export async function getRecords(params = {}) {
  const response = await api.get('/records', { params })
  return response.data
}

export async function getRecord(id) {
  const response = await api.get(`/records/${id}`)
  return response.data
}

export async function createRecord(recordData) {
  const response = await api.post('/records', recordData)
  return response.data
}

export async function updateRecord(id, updateData) {
  const response = await api.put(`/records/${id}`, updateData)
  return response.data
}

export async function deleteRecord(id) {
  const response = await api.delete(`/records/${id}`)
  return response.data
}

export async function authorizeDoctor(recordId, doctorId) {
  const response = await api.post(`/records/${recordId}/authorize`, { doctorId })
  return response.data
}

export async function revokeDoctor(recordId, doctorId) {
  const response = await api.post(`/records/${recordId}/revoke`, { doctorId })
  return response.data
}

export default api

