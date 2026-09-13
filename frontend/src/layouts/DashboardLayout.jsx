import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './DashboardLayout.module.css'

const NAV = [
  { to: '/dashboard', label: 'Overview'       },
  { to: '/stations',  label: 'Stations'        },
  { to: '/charging',  label: 'Charge Request'  },
  { to: '/fleet',     label: 'Fleet'           },
  { to: '/analytics', label: 'Analytics'       },
  { to: '/settings',  label: 'Settings'        },
]

const PAGE_TITLES = {
  '/dashboard': 'Overview',
  '/stations':  'Stations',
  '/charging':  'Charge Request',
  '/fleet':     'Fleet Optimisation',
  '/analytics': 'Analytics',
  '/settings':  'Settings',
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = (user?.name || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const pageTitle = PAGE_TITLES[location.pathname] || 'GreenCharge'

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>GC</div>
          <span className={styles.brandName}>GreenCharge</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || 'User'}</span>
            <span className={styles.userRole}>{user?.role || 'DRIVER'}</span>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            ↪
          </button>
        </div>
      </aside>

      <div className={styles.body}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.liveDot} aria-hidden="true" />
            <span className={styles.topbarTitle}>{pageTitle}</span>
          </div>
          <div className={styles.topbarRight}>
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

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
