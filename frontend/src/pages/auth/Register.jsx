import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import styles from './Auth.module.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
      await api.post('/auth/register', form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Backend not connected yet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topLabel}>Get started</div>
      <h2 className={styles.heading}>Create your account</h2>
      <p className={styles.sub}>Join the EV Renewable Platform</p>

      {error && (
        <div className={styles.error}>
          <span>⚠</span> {error}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="name">Full name</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>👤</span>
            <input
              id="name" name="name" type="text"
              autoComplete="name" required
              value={form.name} onChange={handleChange}
              placeholder="Jane Doe"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="email">Email address</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>✉</span>
            <input
              id="email" name="email" type="email"
              autoComplete="email" required
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              id="password" name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password" required minLength={8}
              value={form.password} onChange={handleChange}
              placeholder="Min 8 characters"
            />
            <button
              type="button" className={styles.eyeBtn}
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading
            ? <><span className={styles.spinner} /> Creating account…</>
            : 'Create account →'}
        </button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
