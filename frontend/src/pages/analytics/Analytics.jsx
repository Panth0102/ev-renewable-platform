import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { useApi } from '../../hooks/useApi.js'
import styles from './Analytics.module.css'

// ── Static chart series (no aggregate-over-time endpoint yet) ──
const weekly = [
  { day: 'Mon', solar: 320, consumed: 410, saved: 190 },
  { day: 'Tue', solar: 280, consumed: 380, saved: 160 },
  { day: 'Wed', solar: 410, consumed: 430, saved: 240 },
  { day: 'Thu', solar: 390, consumed: 400, saved: 220 },
  { day: 'Fri', solar: 460, consumed: 470, saved: 280 },
  { day: 'Sat', solar: 500, consumed: 380, saved: 320 },
  { day: 'Sun', solar: 480, consumed: 350, saved: 300 },
]

const monthly = [
  { month: 'Jan', co2: 1.2 }, { month: 'Feb', co2: 1.5 },
  { month: 'Mar', co2: 2.1 }, { month: 'Apr', co2: 1.8 },
  { month: 'May', co2: 2.4 }, { month: 'Jun', co2: 2.9 },
  { month: 'Jul', co2: 3.1 }, { month: 'Aug', co2: 2.7 },
  { month: 'Sep', co2: 2.2 },
]

const PIE_COLORS = ['#18B96B', '#063B32', '#7fb89e']

function fmt(val, dec = 1) {
  if (val == null) return '—'
  const n = parseFloat(val)
  return isNaN(n) ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: dec })
}

export default function Analytics() {
  const { data: kpi, loading, error } = useApi('/v1/dashboard/kpi', null)

  // Derive live values; fall back gracefully when API is unavailable
  const solarSharePct    = kpi ? parseFloat(kpi.solarSharePct   || 0) : null
  const co2SavedMonthKg  = kpi ? parseFloat(kpi.co2SavedMonthKg || 0) : null
  const energyTodayKwh   = kpi ? parseFloat(kpi.energyTodayKwh  || 0) : null
  const activeSessions   = kpi ? kpi.activeSessions : null

  // Energy mix pie: solar share from live KPI, rest split between grid and battery
  const energyMix = solarSharePct != null
    ? [
        { name: 'Solar',   value: Math.round(solarSharePct) },
        { name: 'Grid',    value: Math.round((100 - solarSharePct) * 0.8) },
        { name: 'Battery', value: Math.round((100 - solarSharePct) * 0.2) },
      ]
    : [
        { name: 'Solar',   value: 58 },
        { name: 'Grid',    value: 32 },
        { name: 'Battery', value: 10 },
      ]

  // Efficiency radial: proxy as solarSharePct, fallback 82
  const efficiencyValue = solarSharePct != null ? Math.round(solarSharePct) : 82
  const efficiency = [{ name: 'Efficiency', value: efficiencyValue, fill: '#18B96B' }]

  const KPI = [
    {
      label: 'Energy Today',
      value: energyTodayKwh != null ? fmt(energyTodayKwh, 0) : '—',
      unit: 'kWh', icon: '☀', color: '#d97706', bg: '#fffbeb',
    },
    {
      label: 'CO₂ Saved (month)',
      value: co2SavedMonthKg != null ? fmt(co2SavedMonthKg / 1000, 2) : '—',
      unit: 't', icon: '🌿', color: '#16a34a', bg: '#f0fdf4',
    },
    {
      label: 'Solar Share',
      value: solarSharePct != null ? fmt(solarSharePct, 1) : '—',
      unit: '%', icon: '⚡', color: '#18B96B', bg: '#E8F6EF',
    },
    {
      label: 'Active Sessions',
      value: activeSessions != null ? String(activeSessions) : '—',
      unit: '', icon: '🔌', color: '#0284c7', bg: '#f0f9ff',
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Analytics</h1>
          <p className={styles.sub}>Energy performance and environmental impact</p>
        </div>
        <div className={styles.periodRow}>
          {['7D', '30D', '90D', '1Y'].map((p, i) => (
            <button key={p} className={`${styles.periodBtn} ${i === 1 ? styles.periodActive : ''}`}>{p}</button>
          ))}
        </div>
      </div>

      {loading && <p className={styles.loadingHint}>Fetching live data…</p>}
      {error   && <p className={styles.errorHint}>Live KPIs unavailable: {error}</p>}

      {/* KPI strip — live from /dashboard/kpi */}
      <div className={styles.kpiRow}>
        {KPI.map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <span className={styles.kpiIcon} style={{ background: k.bg, color: k.color }}>{k.icon}</span>
            <div>
              <div className={styles.kpiValue} style={{ color: k.color }}>
                {k.value}<span className={styles.kpiUnit}>{k.unit}</span>
              </div>
              <div className={styles.kpiLabel}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* row 1 */}
      <div className={styles.row}>
        {/* weekly area */}
        <div className={`${styles.card} ${styles.wide}`}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Weekly Energy (kWh)</h2>
              <p className={styles.cardSub}>Solar generated vs consumed vs cost saved</p>
            </div>
            <span className={styles.cardBadge}>This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                {[['gS','#18B96B'],['gC','#063B32'],['gSv','#d97706']].map(([id, c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={c} stopOpacity={0}    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="solar"    stroke="#18B96B" fill="url(#gS)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="consumed" stroke="#063B32" fill="url(#gC)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="saved"    stroke="#d97706" fill="url(#gSv)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* pie — live energy mix */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Energy Source Mix</h2>
              <p className={styles.cardSub}>{solarSharePct != null ? 'Live from today\'s sessions' : 'Estimated share this week'}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={energyMix}
                cx="50%" cy="50%"
                innerRadius={58} outerRadius={88}
                paddingAngle={4} dataKey="value"
              >
                {energyMix.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)' }} />
              <Legend
                iconType="circle" iconSize={8}
                formatter={(val, entry) => `${val} ${entry.payload.value}%`}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* row 2 */}
      <div className={styles.row}>
        {/* CO2 bar */}
        <div className={`${styles.card} ${styles.wide}`}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>CO₂ Saved Monthly (tonnes)</h2>
              <p className={styles.cardSub}>Carbon offset through renewable EV charging</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={v => [`${v}t`, 'CO₂ Saved']}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                cursor={{ fill: 'rgba(24,185,107,0.07)' }}
              />
              <Bar dataKey="co2" fill="#18B96B" radius={[5, 5, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* radial gauge — live solar share */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Renewable Utilisation</h2>
              <p className={styles.cardSub}>{solarSharePct != null ? 'Live solar share today' : 'Overall renewable utilisation'}</p>
            </div>
          </div>
          <div className={styles.gaugeWrap}>
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart
                cx="50%" cy="55%"
                innerRadius="65%" outerRadius="90%"
                startAngle={210} endAngle={-30}
                data={efficiency}
              >
                <RadialBar background={{ fill: 'var(--color-border)' }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className={styles.gaugeLabel}>
              <span className={styles.gaugeValue}>{efficiencyValue}%</span>
              <span className={styles.gaugeSub}>{efficiencyValue >= 70 ? 'Excellent' : efficiencyValue >= 50 ? 'Good' : 'Low'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
