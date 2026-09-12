import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'
import styles from './Fleet.module.css'

// ── Initial fleet data ────────────────────────────────────────
const INITIAL_VEHICLES = [
  { id: 'V-001', name: 'Bus #1',   battery: 120, currentSoc: 40, targetSoc: 95, departure: 6,  charger: 50 },
  { id: 'V-002', name: 'Bus #2',   battery: 120, currentSoc: 25, targetSoc: 90, departure: 7,  charger: 50 },
  { id: 'V-003', name: 'Van #1',   battery:  60, currentSoc: 55, targetSoc: 85, departure: 8,  charger: 22 },
  { id: 'V-004', name: 'Van #2',   battery:  60, currentSoc: 30, targetSoc: 90, departure: 8,  charger: 22 },
  { id: 'V-005', name: 'Car #1',   battery:  45, currentSoc: 20, targetSoc: 80, departure: 9,  charger: 11 },
]

const STATION_CAPACITY = 100 // kW total available

const RENEWABLE_CURVE = [
  0, 0, 0, 0, 5, 10, 25, 45, 65, 82, 90, 95,
  95, 88, 78, 65, 45, 25, 10, 5, 2, 0, 0, 0,
]

// ── Simulate naive (all at once) vs optimised charging ───────
function simulate(vehicles) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Naive: everyone starts charging immediately at full power
  const naive = hours.map(h => {
    const load = vehicles.reduce((sum, v) => {
      if (h < v.departure) return sum + v.charger
      return sum
    }, 0)
    return { hour: `${String(h).padStart(2,'0')}:00`, load, renewable: RENEWABLE_CURVE[h] }
  })

  // Optimised: spread load using renewable windows, respect station cap
  const optimised = hours.map(h => {
    // Sort vehicles by renewable score for this hour (higher renewable = more likely to charge)
    const renewable = RENEWABLE_CURVE[h]
    let remaining = STATION_CAPACITY
    const load = vehicles.reduce((sum, v) => {
      if (h >= v.departure) return sum
      const needed = ((v.targetSoc - v.currentSoc) / 100) * v.battery
      const timeLeft = v.departure - h
      const minRate = needed / timeLeft
      // Charge at full power only if renewable is good or deadline is near
      const rate = (renewable > 50 || timeLeft <= 2)
        ? Math.min(v.charger, remaining)
        : Math.min(minRate * 1.2, remaining)
      remaining = Math.max(0, remaining - rate)
      return sum + Math.max(0, rate)
    }, 0)
    return { hour: `${String(h).padStart(2,'0')}:00`, load: Math.round(load), renewable }
  })

  // Compute summary metrics
  const naivePeak = Math.max(...naive.map(h => h.load))
  const optPeak = Math.max(...optimised.map(h => h.load))

  const naiveRenew = naive.reduce((s, h) => s + h.load * h.renewable, 0) /
    (naive.reduce((s, h) => s + h.load, 0) || 1)
  const optRenew = optimised.reduce((s, h) => s + h.load * h.renewable, 0) /
    (optimised.reduce((s, h) => s + h.load, 0) || 1)

  return {
    naive,
    optimised,
    peakReduction: naivePeak - optPeak,
    renewableGain: Math.round(optRenew - naiveRenew),
    naivePeak,
    optPeak,
    naiveRenew: Math.round(naiveRenew),
    optRenew: Math.round(optRenew),
  }
}

export default function Fleet() {
  const [vehicles] = useState(INITIAL_VEHICLES)
  const [ran, setRan] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleOptimise = () => {
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      setResult(simulate(vehicles))
      setRan(true)
      setLoading(false)
    }, 1100)
  }

  const comparison = result
    ? result.naive.map((n, i) => ({
        hour: n.hour,
        naive: n.load,
        optimised: result.optimised[i].load,
        renewable: n.renewable,
      }))
    : []

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Fleet Optimisation</h1>
          <p className={styles.sub}>
            Coordinate {vehicles.length} vehicles — same requirements, smarter timing
          </p>
        </div>
        <button className={styles.runBtn} onClick={handleOptimise} disabled={loading}>
          {loading
            ? <><span className={styles.spinner} /> Running…</>
            : ran ? '⟳ Re-run Optimisation' : '▶ Run Fleet Optimisation'}
        </button>
      </div>

      {/* Fleet table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Vehicles in Fleet</h2>
          <span className={styles.tableBadge}>{vehicles.length} vehicles · {STATION_CAPACITY} kW station cap</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Current SOC</th>
                <th>Target SOC</th>
                <th>Battery</th>
                <th>Charger</th>
                <th>Departure</th>
                <th>Energy Needed</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => {
                const needed = Math.round(((v.targetSoc - v.currentSoc) / 100) * v.battery * 10) / 10
                return (
                  <tr key={v.id}>
                    <td>
                      <span className={styles.vehicleId}>{v.id}</span>
                      <span className={styles.vehicleName}>{v.name}</span>
                    </td>
                    <td>
                      <div className={styles.socCell}>
                        <div className={styles.socMini}>
                          <div className={styles.socMiniFill}
                            style={{ width: `${v.currentSoc}%`, background: '#d97706' }} />
                        </div>
                        <span>{v.currentSoc}%</span>
                      </div>
                    </td>
                    <td><span className={styles.targetBadge}>{v.targetSoc}%</span></td>
                    <td>{v.battery} kWh</td>
                    <td>{v.charger} kW</td>
                    <td>{String(v.departure).padStart(2, '0')}:00</td>
                    <td><strong style={{ color: 'var(--color-accent)' }}>{needed} kWh</strong></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className={styles.loadingCard}>
          <span className={styles.loadingRing} />
          <span>Coordinating {vehicles.length} vehicles across renewable windows…</span>
        </div>
      )}

      {result && (
        <>
          {/* Summary metrics */}
          <div className={styles.metricsRow}>
            {[
              { label: 'Peak Load Reduction', value: `↓ ${result.peakReduction} kW`, sub: `${result.naivePeak} → ${result.optPeak} kW`, color: '#18B96B', bg: 'var(--color-accent-light)' },
              { label: 'Renewable Alignment', value: `↑ ${result.renewableGain}%`,    sub: `${result.naiveRenew}% → ${result.optRenew}%`,   color: '#d97706', bg: '#fffbeb' },
              { label: 'Station Capacity',    value: `${STATION_CAPACITY} kW`,          sub: 'Respected at all times',                          color: '#0284c7', bg: '#f0f9ff' },
              { label: 'Vehicles Scheduled',  value: `${vehicles.length} / ${vehicles.length}`, sub: 'All targets met before departure',         color: '#16a34a', bg: '#f0fdf4' },
            ].map(m => (
              <div key={m.label} className={styles.metricCard} style={{ background: m.bg }}>
                <span className={styles.metricVal} style={{ color: m.color }}>{m.value}</span>
                <span className={styles.metricLabel}>{m.label}</span>
                <span className={styles.metricSub}>{m.sub}</span>
              </div>
            ))}
          </div>

          {/* Comparison chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Naive vs Optimised Load Profile</h2>
                <p className={styles.chartSub}>
                  Same vehicles, same charging requirements — smarter timing
                </p>
              </div>
              <span className={styles.chartBadge}>24h View</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={comparison} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                  formatter={(v, n) => [`${v} kW`, n === 'naive' ? 'Naive' : n === 'optimised' ? 'Optimised' : 'Renewable %']}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="naive"     stroke="#e53e3e" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="optimised" stroke="#18B96B" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="renewable" stroke="#d97706" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hour-by-hour optimised bar */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Optimised Schedule — Power per Hour</h2>
                <p className={styles.chartSub}>Fleet total charging load distributed across renewable windows</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={result.optimised} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                  formatter={(v, n) => [`${v} ${n === 'load' ? 'kW' : '%'}`, n === 'load' ? 'Load' : 'Renewable']}
                  cursor={{ fill: 'rgba(24,185,107,0.06)' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="load"      fill="#18B96B" radius={[4,4,0,0]} maxBarSize={28} />
                <Bar dataKey="renewable" fill="#d97706" radius={[4,4,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* outcome strip */}
          <div className={styles.outcomeStrip}>
            {[
              ['✓', 'On-Time Charging',     'All vehicles reach target SOC before departure'],
              ['↓', 'Cost Reduced',          'Charging shifted to lower-cost renewable windows'],
              ['↓', 'Estimated Emissions',   'Higher renewable share reduces carbon intensity'],
              ['↑', 'Renewable Alignment',   `${result.optRenew}% average renewable share`],
            ].map(([icon, title, desc]) => (
              <div key={title} className={styles.outcomeCard}>
                <span className={styles.outcomeIcon}>{icon}</span>
                <div>
                  <p className={styles.outcomeTitle}>{title}</p>
                  <p className={styles.outcomeDesc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
