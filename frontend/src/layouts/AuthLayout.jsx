import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AuthLayout.module.css'

const PILLS = ['Solar Powered', 'Smart Routing', 'Real-time Analytics', 'Fleet Ready']

export default function AuthLayout() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className={styles.wrapper}>
      {/* ── Left branding panel ── */}
      <div className={styles.left}>
        <div className={styles.brandMark}>
          <div className={styles.logoCircle}>⚡</div>
          <span className={styles.brandName}>EV Renewable</span>
        </div>

        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Power the future<br />with <span>smart energy</span>
          </h1>
          <p className={styles.heroSub}>
            Manage EV charging stations, track renewable energy consumption,
            and optimise your fleet — all from one dashboard.
          </p>
          <div className={styles.pillRow}>
            {PILLS.map(p => <span key={p} className={styles.pill}>{p}</span>)}
          </div>
        </div>

        {/* decorative stat strip */}
        <div className={styles.statStrip}>
          <div className={styles.stripStat}>
            <span className={styles.stripVal}>12+</span>
            <span className={styles.stripLabel}>Active Stations</span>
          </div>
          <div className={styles.stripDivider} />
          <div className={styles.stripStat}>
            <span className={styles.stripVal}>68%</span>
            <span className={styles.stripLabel}>Solar Usage</span>
          </div>
          <div className={styles.stripDivider} />
          <div className={styles.stripStat}>
            <span className={styles.stripVal}>1.2 MW</span>
            <span className={styles.stripLabel}>Delivered Today</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.right}>
        <div className={styles.card}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
