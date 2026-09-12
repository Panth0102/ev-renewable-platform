import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AuthLayout.module.css'

const TAGS = ['Solar Powered', 'Smart Routing', 'Real-time Analytics', 'Fleet Ready']

export default function AuthLayout() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className={styles.wrapper}>
      {/* Left panel */}
      <div className={styles.left}>
        <div className={styles.brandMark}>
          <div className={styles.logoBlock}>GC</div>
          <span className={styles.brandName}>GreenCharge</span>
        </div>

        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Smarter EV charging,<br />less grid stress.
          </h1>
          <p className={styles.heroSub}>
            GreenCharge schedules EV charging around renewable availability,
            grid conditions, and driver departure times.
          </p>
          <div className={styles.tagRow}>
            {TAGS.map(t => <span key={t} className={styles.tag}>{t}</span>)}
          </div>
        </div>

        <div className={styles.statStrip}>
          <div className={styles.stripStat}>
            <span className={styles.stripVal}>12</span>
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

      {/* Right panel */}
      <div className={styles.right}>
        <div className={styles.card}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
