import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AuthLayout.module.css'

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
            EV charging that follows the sun.
          </h1>
          <p className={styles.heroSub}>
            Schedules charging around renewable availability,
            grid conditions, and departure times — so vehicles
            charge greener without missing their window.
          </p>
          <div className={styles.tagRow}>
            {['Renewable-aware', 'Fleet scheduling', 'Grid-friendly', 'Real-time'].map(t => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        </div>

        <p className={styles.caption}>
          GreenCharge Platform · HackOut 2026
        </p>
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
