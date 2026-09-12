import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import styles from './Dashboard.module.css'

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

const STATS = [
  {
    label: 'Active Stations', value: '12', unit: '', change: '+2 this week',
    up: true, icon: '⚡', bg: '#E8F6EF', accent: '#18B96B',
  },
  {
    label: 'Energy Today', value: '1,284', unit: 'kWh', change: '+8% vs yesterday',
    up: true, icon: '☀', bg: '#fef9ec', accent: '#d97706',
  },
  {
    label: 'Active Sessions', value: '47', unit: '', change: '3 ending soon',
    up: null, icon: '🔌', bg: '#f0f9ff', accent: '#0284c7',
  },
  {
    label: 'Solar Share', value: '68', unit: '%', change: '+5% vs last week',
    up: true, icon: '♻', bg: '#f0fdf4', accent: '#16a34a',
  },
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

export default function Dashboard() {
  return (
    <div className={styles.page}>
      {/* page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Overview</h1>
          <p className={styles.subheading}>Live snapshot of your EV &amp; renewable energy network</p>
        </div>
        <div className={styles.headerBadge}>
          <span className={styles.badgeDot} />
          All systems operational
        </div>
      </div>

      {/* KPI cards */}
      <div className={styles.statsGrid}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statCard} style={{ '--card-bg': s.bg }}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statIconWrap} style={{ background: s.bg, color: s.accent }}>
                {s.icon}
              </span>
            </div>
            <div className={styles.statValue} style={{ color: s.accent }}>
              {s.value}<span className={styles.statUnit}>{s.unit}</span>
            </div>
            <div className={styles.statChange}>
              {s.up === true && <span className={styles.upArrow}>↑</span>}
              {s.up === false && <span className={styles.downArrow}>↓</span>}
              <span className={s.up ? styles.changeGreen : s.up === false ? styles.changeRed : styles.changeMuted}>
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* charts row */}
      <div className={styles.chartsRow}>
        {/* energy area chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h2 className={styles.chartTitle}>Energy Mix</h2>
              <p className={styles.chartSub}>Solar · Grid · EV load — today (kW)</p>
            </div>
            <span className={styles.chartBadge}>Today</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={energyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#d97706" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gGrid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0284c7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#18B96B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#18B96B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1ead9" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#3d7a65' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#3d7a65' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="solar" stroke="#d97706" fill="url(#gSolar)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="grid"  stroke="#0284c7" fill="url(#gGrid)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="ev"    stroke="#18B96B" fill="url(#gEv)"    strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* station bar chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h2 className={styles.chartTitle}>Station Activity</h2>
              <p className={styles.chartSub}>Sessions &amp; energy per station</p>
            </div>
            <span className={styles.chartBadge}>This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stationData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1ead9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#3d7a65' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#3d7a65' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #c9e8d8', fontSize: 12 }}
                cursor={{ fill: 'rgba(24,185,107,0.06)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sessions" fill="#18B96B" radius={[5, 5, 0, 0]} maxBarSize={28} />
              <Bar dataKey="energy"   fill="#063B32" radius={[5, 5, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* recent activity */}
      <div className={styles.activityCard}>
        <h2 className={styles.chartTitle}>Recent Activity</h2>
        <ul className={styles.activityList}>
          {[
            { icon: '⚡', text: 'Station Alpha — new session started', time: '2 min ago', color: '#18B96B' },
            { icon: '☀', text: 'Solar generation peaked at 95 kW',     time: '18 min ago', color: '#d97706' },
            { icon: '✓', text: 'Station Delta — session completed (42 kWh)', time: '34 min ago', color: '#0284c7' },
            { icon: '⚠', text: 'Station Gamma — offline (maintenance)', time: '1 hr ago', color: '#e53e3e' },
            { icon: '↑', text: 'Grid export: 120 kWh surplus sent back', time: '2 hr ago', color: '#16a34a' },
          ].map((a, i) => (
            <li key={i} className={styles.activityItem}>
              <span className={styles.activityDot} style={{ background: a.color + '22', color: a.color }}>
                {a.icon}
              </span>
              <span className={styles.activityText}>{a.text}</span>
              <span className={styles.activityTime}>{a.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
