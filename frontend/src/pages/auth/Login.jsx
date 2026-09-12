import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  // Prefilled with mock admin credentials
  const [form, setForm] = useState({ email: 'admin@evrenewable.com', password: 'admin123' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password. Use the prefilled credentials below.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topLabel}>Welcome back</div>
      <h2 className={styles.heading}>Sign in to your account</h2>
      <p className={styles.sub}>Monitor your EV stations and energy data</p>

      <div className={styles.hintBanner}>
        <span className={styles.hintIcon}>🔑</span>
        <div>
          <span className={styles.hintTitle}>Demo credentials are prefilled</span>
          <span className={styles.hintText}> — just click Sign in</span>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <span>⚠</span> {error}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="email">Email address</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>✉</span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              id="password"
              name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading
            ? <><span className={styles.spinner} /> Signing in…</>
            : 'Sign in →'}
        </button>
      </form>

      <p className={styles.switch}>
        No account? <Link to="/register">Create one</Link>
      </p>
    </div>
  )
}
