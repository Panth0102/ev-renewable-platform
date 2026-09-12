import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

const TOKEN_KEY         = import.meta.env.VITE_TOKEN_KEY         || 'ev_access_token'
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'ev_refresh_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ev_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // ── Login — calls POST /api/v1/auth/login ────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/v1/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, data.accessToken)
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
    }
    localStorage.setItem('ev_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  // ── Register — calls POST /api/v1/auth/register ──────────
  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/v1/auth/register', { name, email, password })
    return data
  }, [])

  // ── Logout ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/v1/auth/logout')
    } catch {
      // best-effort — clear local state regardless
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem('ev_user')
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
