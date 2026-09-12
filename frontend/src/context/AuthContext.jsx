import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

// ── Prefill admin user so the app is usable without a backend ──
const MOCK_ADMIN = {
  id: 1,
  name: 'Admin',
  email: 'admin@evrenewable.com',
  role: 'ADMIN',
}
const MOCK_CREDENTIALS = { email: 'admin@evrenewable.com', password: 'admin123' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ev_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, password) => {
    // ── Mock login — bypass backend until it is ready ──
    if (
      email === MOCK_CREDENTIALS.email &&
      password === MOCK_CREDENTIALS.password
    ) {
      localStorage.setItem('ev_access_token', 'mock-jwt-token')
      localStorage.setItem('ev_user', JSON.stringify(MOCK_ADMIN))
      setUser(MOCK_ADMIN)
      return { user: MOCK_ADMIN, token: 'mock-jwt-token' }
    }
    // ── Real backend login (uncomment when backend is ready) ──
    // const { data } = await api.post('/auth/login', { email, password })
    // localStorage.setItem(import.meta.env.VITE_TOKEN_KEY || 'ev_access_token', data.token)
    // localStorage.setItem('ev_user', JSON.stringify(data.user))
    // setUser(data.user)
    // return data

    throw new Error('Invalid credentials')
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ev_access_token')
    localStorage.removeItem('ev_refresh_token')
    localStorage.removeItem('ev_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user) }}>
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
