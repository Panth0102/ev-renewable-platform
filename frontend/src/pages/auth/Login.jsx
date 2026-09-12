import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: 'admin@evrenewable.com', password: 'admin123' })
  const [error, setError]   = useState('')
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
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Invalid email or password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Sign in</h2>
      <p className={styles.sub}>Access your GreenCharge dashboard</p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.hintBanner} style={{
        background: '#E8F6EF', border: '1px solid #18B96B',
        borderRadius: 8, padding: '0.6rem 0.9rem',
        fontSize: '0.82rem', color: '#063B32', marginBottom: '0.75rem'
      }}>
        <strong>Demo credentials pre-filled.</strong> Just click Sign in.
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <div className={styles.inputWrap}>
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
            <input
              id="password" name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password" required
              value={form.password} onChange={handleChange}
              placeholder="Password"
            />
            <button
              type="button" className={styles.eyeBtn}
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading
            ? <><span className={styles.spinner} /> Signing in…</>
            : 'Sign in'}
        </button>
      </form>

      <p className={styles.switch}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
