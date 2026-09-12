import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import styles from './Auth.module.css'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/login')
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Create account</h2>
      <p className={styles.sub}>Register for GreenCharge</p>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="name">Full name</label>
          <div className={styles.inputWrap}>
            <input
              id="name" name="name" type="text"
              autoComplete="name" required
              value={form.name} onChange={handleChange}
              placeholder="Jane Doe"
            />
          </div>
        </div>

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
              autoComplete="new-password" required minLength={8}
              value={form.password} onChange={handleChange}
              placeholder="Min 8 characters"
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
            ? <><span className={styles.spinner} /> Creating account…</>
            : 'Create account'}
        </button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
