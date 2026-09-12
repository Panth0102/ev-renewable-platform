import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import styles from './Settings.module.css'

const TOGGLE_ITEMS = [
  { id: 'notif',  label: 'Session notifications',   desc: 'Alert when a charging session starts or ends' },
  { id: 'solar',  label: 'Solar surplus alerts',     desc: 'Notify when solar exceeds 90% of load'       },
  { id: 'report', label: 'Weekly energy report',     desc: 'Receive a weekly summary via email'           },
]

export default function Settings() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [saved, setSaved] = useState(false)
  const [toggles, setToggles] = useState({ notif: true, solar: false, report: true })

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
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
              {(user?.name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className={styles.avatarName}>{user?.name || 'Admin'}</p>
              <p className={styles.avatarRole}>{user?.role || 'Administrator'}</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Full name</label>
                <input type="text" defaultValue={user?.name || 'Admin'} placeholder="Your name" />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" defaultValue={user?.email || 'admin@evrenewable.com'} placeholder="email" />
              </div>
            </div>
            <div className={styles.field}>
              <label>Organisation</label>
              <input type="text" defaultValue="EV Renewable Ltd" placeholder="Organisation name" />
            </div>
            <button className={styles.saveBtn} type="submit">
              {saved ? <><span className={styles.checkmark}>✓</span> Saved!</> : 'Save changes'}
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
