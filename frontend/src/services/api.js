import axios from 'axios'

const TOKEN_KEY         = import.meta.env.VITE_TOKEN_KEY         || 'ev_access_token'
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'ev_refresh_token'

// VITE_API_BASE_URL = http://localhost:8080/api  → strip trailing /api so we can use /api/v1/...
const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
// Normalise: ensure it ends without a slash
const BASE_URL = rawBase.replace(/\/$/, '')

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// ── Attach JWT to every request ───────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Handle 401 — attempt token refresh, then redirect ────
let isRefreshing = false
let failedQueue  = []

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!refreshToken) {
        localStorage.removeItem(TOKEN_KEY)
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing    = true

      try {
        const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh`, {
          refreshToken,
        })
        localStorage.setItem(TOKEN_KEY, data.accessToken)
        if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        localStorage.removeItem('ev_user')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
