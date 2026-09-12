import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './DashboardLayout.module.css'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',      section: null },
  { to: '/stations',  label: 'Stations',        section: null },
  { to: '/charging',  label: 'Charge Request',  section: 'GreenCharge' },
  { to: '/fleet',     label: 'Fleet',           section: null },
  { to: '/analytics', label: 'Analytics',       section: 'Insights' },
  { to: '/settings',  label: 'Settings',        section: null },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = (user?.name || 'A')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        {/* brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>GC</div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>GreenCharge</span>
            <span className={styles.brandTag}>Platform</span>
          </div>
        </div>

        {/* nav */}
        <nav className={styles.nav}>
          {NAV.map(({ to, label, section }) => (
            <div key={to}>
              {section && (
                <span className={styles.navSection}>{section}</span>
              )}
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.navLabel}>{label}</span>
              </NavLink>
            </div>
          ))}
        </nav>

        {/* user */}
        <div className={styles.userSection}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || 'Admin'}</span>
            <span className={styles.userRole}>{user?.role || 'Administrator'}</span>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            Out
          </button>
        </div>
      </aside>

      {/* topbar + content */}
      <div className={styles.body}>
        <header className={styles.topbar}>
          <span className={styles.topbarGreeting}>
            Good {getTimeOfDay()}, <strong>{user?.name || 'Admin'}</strong>
          </span>
          <div className={styles.topbarRight}>
            <div className={styles.liveChip}>
              <span className={styles.liveDot} />
              Live
            </div>
            <span className={styles.topbarDate}>{formatDate()}</span>
          </div>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}
