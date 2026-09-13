import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { useApi } from '../../hooks/useApi.js'
import styles from './Dashboard.module.css'

// ── Static chart data (energy signals not yet exposed as a chart endpoint) ──
const energyData = [
  { time: '00:00', solar: 0,  grid: 40, ev: 20 },
  { time: '04:00', solar: 0,  grid: 30, ev: 15 },
  { time: '08:00', solar: 60, grid: 20, ev: 45 },
  { time: '12:00', solar: 95, grid: 5,  ev: 70 },
  { time: '16:00', solar: 75, grid: 15, ev: 60 },
  { time: '20:00', solar: 10, grid: 50, ev: 35 },
  { time: '23:59', solar: 0,  grid: 45, ev: 25 },
]

const stationData = [
  { name: 'Alpha',   sessions: 24, energy: 180 },
  { name: 'Beta',    sessions: 18, energy: 135 },
  { name: 'Gamma',   sessions: 31, energy: 240 },
  { name: 'Delta',   sessions: 12, energy: 95  },
  { name: 'Epsilon', sessions: 27, energy: 210 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className={styles.tooltipRow}>
          <span>{p.name}</span><span>{p.value} kW</span>
        </p>
      ))}
    </div>
  )
}

function fmt(val, decimals = 0) {
  if (val == null) return '—'
  const n = parseFloat(val)
  return isNaN(n) ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: decimals })
}

export default function Dashboard() {
  const { data: kpi, loading, error } = useApi('/v1/dashboard/kpi', null)

  const stats = kpi
    ? [
        { label: 'Active Stations', value: fmt(kpi.activeStations),              unit: '',    change: 'Live count',             up: null  },
        { label: 'Energy Today',    value: fmt(kpi.energyTodayKwh, 1),           unit: 'kWh', change: 'Sessions since midnight', up: true  },
        { label: 'Active Sessions', value: fmt(kpi.activeSessions),               unit: '',    change: 'Currently charging',     up: null  },
        { label: 'Solar Share',     value: fmt(kpi.solarSharePct, 1),             unit: '%',   change: 'Avg today',              up: true  },
        { label: 'CO₂ Saved',       value: fmt(kpi.co2SavedMonthKg, 1),           unit: 'kg',  change: 'This month',             up: true  },
      ]
    : []

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Charging network overview</h1>
          <p className={styles.subheading}>Live data — stations, sessions, energy and renewable share</p>
        </div>
        <div className={styles.headerBadge}>
          <span className={styles.liveDot} />
          {loading ? 'Loading' : error ? 'Backend offline' : 'Live'}
        </div>
      </div>

      {/* KPI cards */}
      {loading && <p className={styles.loadingHint}>Loading…</p>}
      {error   && <p className={styles.errorHint}>KPIs unavailable: {error}</p>}

      {!loading && !error && (
        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statLabel}>{s.label}</span>
              <div className={styles.statValue}>
                {s.value}<span className={styles.statUnit}>{s.unit}</span>
              </div>
              <div className={styles.statChange}>
                {s.up === true  && <span className={styles.upArrow}>↑ </span>}
                {s.up === false && <span className={styles.downArrow}>↓ </span>}
                <span className={s.up ? styles.changeGreen : s.up === false ? styles.changeRed : styles.changeMuted}>
                  {s.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* charts row */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h2 className={styles.chartTitle}>Energy Mix</h2>
              <p className={styles.chartSub}>Solar, Grid, EV load — today (kW)</p>
            </div>
            <span className={styles.chartBadge}>Today</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={energyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#d97706" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gGrid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0284c7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#18B96B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#18B96B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="solar" stroke="#d97706" fill="url(#gSolar)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="grid"  stroke="#0284c7" fill="url(#gGrid)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="ev"    stroke="#18B96B" fill="url(#gEv)"    strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h2 className={styles.chartTitle}>Station Activity</h2>
              <p className={styles.chartSub}>Sessions and energy per station</p>
            </div>
            <span className={styles.chartBadge}>This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stationData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                cursor={{ fill: 'rgba(24,185,107,0.06)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sessions" fill="#18B96B" radius={[4,4,0,0]} maxBarSize={28} />
              <Bar dataKey="energy"   fill="#063B32" radius={[4,4,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* recent activity — compact */}
      <div className={styles.activityCard}>
        <h2 className={styles.chartTitle}>Recent activity</h2>
        <ul className={styles.activityList}>
          {[
            { label: 'Station Alpha',  text: 'New session started',             time: '2 min ago',  color: '#16a869' },
            { label: 'Solar',          text: 'Generation peaked at 95 kW',       time: '18 min ago', color: '#d97706' },
            { label: 'Station Delta',  text: 'Session completed — 42 kWh',       time: '34 min ago', color: '#0369a1' },
            { label: 'Station Gamma',  text: 'Offline — maintenance',            time: '1 hr ago',   color: '#dc2626' },
            { label: 'Grid',           text: '120 kWh surplus returned to grid', time: '2 hr ago',   color: '#15803d' },
          ].map((a, i) => (
            <li key={i} className={styles.activityItem}>
              <span className={styles.activityDot} style={{ background: a.color }} />
              <div className={styles.activityBody}>
                <span className={styles.activityLabel}>{a.label}</span>
                <span className={styles.activityText}>{a.text}</span>
              </div>
              <span className={styles.activityTime}>{a.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
