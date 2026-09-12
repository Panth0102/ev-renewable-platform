import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import api from '../../services/api.js'
import styles from './Settings.module.css'

const TOGGLE_ITEMS = [
  { id: 'notif',  label: 'Session notifications',   desc: 'Alert when a charging session starts or ends' },
  { id: 'solar',  label: 'Solar surplus alerts',     desc: 'Notify when solar exceeds 90% of load'       },
  { id: 'report', label: 'Weekly energy report',     desc: 'Receive a weekly summary via email'           },
]

export default function Settings() {
  const { user, login } = useAuth()
  const { theme, setTheme } = useTheme()

  const [form, setForm] = useState({
    name:         user?.name         || '',
    email:        user?.email        || '',
    organisation: user?.organisation || '',
    phone:        user?.phone        || '',
  })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [saveError, setSaveError] = useState('')
  const [toggles, setToggles] = useState({ notif: true, solar: false, report: true })

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      const { data } = await api.put('/v1/auth/me', {
        name:         form.name         || undefined,
        email:        form.email        || undefined,
        organisation: form.organisation || undefined,
        phone:        form.phone        || undefined,
      })
      // Update stored user in localStorage so AuthContext reflects new values
      const updated = { ...user, ...data }
      localStorage.setItem('ev_user', JSON.stringify(updated))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = (id) => setToggles(t => ({ ...t, [id]: !t[id] }))

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Settings</h1>
          <p className={styles.sub}>Manage your account and preferences</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Profile */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>👤</span>
            <div>
              <h2 className={styles.cardTitle}>Profile</h2>
              <p className={styles.cardSub}>Your personal information</p>
            </div>
          </div>

          {/* avatar */}
          <div className={styles.avatarRow}>
            <div className={styles.avatar}>
              {(form.name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className={styles.avatarName}>{form.name || user?.name || 'User'}</p>
              <p className={styles.avatarRole}>{user?.role || 'DRIVER'}</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label htmlFor="name">Full name</label>
                <input
                  id="name" name="name" type="text"
                  value={form.name} onChange={handleChange}
                  placeholder="Your name"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email" name="email" type="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label htmlFor="organisation">Organisation</label>
                <input
                  id="organisation" name="organisation" type="text"
                  value={form.organisation} onChange={handleChange}
                  placeholder="Organisation name"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone" name="phone" type="tel"
                  value={form.phone} onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {saveError && <p className={styles.errorHint}>{saveError}</p>}

            <button className={styles.saveBtn} type="submit" disabled={saving}>
              {saving
                ? <><span className={styles.spinner} /> Saving…</>
                : saved
                ? <><span className={styles.checkmark}>✓</span> Saved!</>
                : 'Save changes'}
            </button>
          </form>
        </div>

        {/* right column */}
        <div className={styles.rightCol}>
          {/* Notifications */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🔔</span>
              <div>
                <h2 className={styles.cardTitle}>Notifications</h2>
                <p className={styles.cardSub}>Choose what you want to hear about</p>
              </div>
            </div>
            <div className={styles.toggleList}>
              {TOGGLE_ITEMS.map(item => (
                <div key={item.id} className={styles.toggleRow}>
                  <div>
                    <p className={styles.toggleLabel}>{item.label}</p>
                    <p className={styles.toggleDesc}>{item.desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={toggles[item.id]}
                    className={`${styles.toggleBtn} ${toggles[item.id] ? styles.toggleOn : ''}`}
                    onClick={() => toggle(item.id)}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🎨</span>
              <div>
                <h2 className={styles.cardTitle}>Appearance</h2>
                <p className={styles.cardSub}>Interface theme preferences</p>
              </div>
            </div>
            <div className={styles.themeRow}>
              {['light', 'dark', 'system'].map(t => (
                <button
                  key={t}
                  className={`${styles.themeBtn} ${theme === t ? styles.themeActive : ''}`}
                  onClick={() => setTheme(t)}
                >
                  <span>{t === 'light' ? '☀' : t === 'dark' ? '🌙' : '⚙'}</span>
                  <span className={styles.themeLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* About */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>ℹ</span>
              <div>
                <h2 className={styles.cardTitle}>About</h2>
                <p className={styles.cardSub}>Platform information</p>
              </div>
            </div>
            <div className={styles.aboutList}>
              {[
                ['Version',      import.meta.env.VITE_APP_VERSION || '1.0.0'],
                ['API endpoint', import.meta.env.VITE_API_BASE_URL || '/api'],
                ['Environment',  import.meta.env.MODE || 'development'],
                ['Build',        'Hackout@DAU 2026'],
              ].map(([k, v]) => (
                <div key={k} className={styles.aboutRow}>
                  <span className={styles.aboutKey}>{k}</span>
                  <span className={styles.aboutVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
