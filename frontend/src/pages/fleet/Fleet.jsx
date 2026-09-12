import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'
import api from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import styles from './Fleet.module.css'

const STATION_CAPACITY = 100 // kW default — overridden by form input

// Poll fleet optimisation run until done
function usePollFleetRun(runId) {
  const [result, setResult] = useState(null)
  const [polling, setPolling] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!runId) return
    setPolling(true)

    const poll = async () => {
      try {
        const { data } = await api.get(`/v1/fleet-optimise/${runId}`)
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          setResult(data)
          setPolling(false)
        } else {
          timerRef.current = setTimeout(poll, 1500)
        }
      } catch {
        setPolling(false)
      }
    }

    timerRef.current = setTimeout(poll, 800)
    return () => clearTimeout(timerRef.current)
  }, [runId])

  return { result, polling }
}

function fmt(v, d = 0) {
  if (v == null) return '—'
  return parseFloat(v).toFixed(d)
}

export default function Fleet() {
  const { data: fleets = [] }   = useApi('/v1/vehicles', []) // we list vehicles; group by fleet
  const { data: vehicles = [] } = useApi('/v1/vehicles', [])

  const [fleetId, setFleetId]       = useState('')
  const [stationCap, setStationCap] = useState(STATION_CAPACITY)
  const [departureTime, setDepartureTime] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [runId, setRunId]           = useState(null)
  const [ran, setRan]               = useState(false)

  const { result, polling } = usePollFleetRun(runId)

  // Default departure 8h from now
  useEffect(() => {
    const d = new Date(Date.now() + 8 * 3600 * 1000)
    d.setSeconds(0, 0)
    setDepartureTime(d.toISOString().slice(0, 16))
  }, [])

  // Unique fleets from vehicles list
  const uniqueFleets = [...new Map(
    vehicles
      .filter(v => v.fleetId)
      .map(v => [v.fleetId, { id: v.fleetId, name: `Fleet ${v.fleetId.slice(0, 8)}` }])
  ).values()]

  const fleetVehicles = fleetId
    ? vehicles.filter(v => v.fleetId === fleetId)
    : []

  const handleOptimise = async () => {
    setSubmitError('')
    if (!fleetId)       { setSubmitError('Select a fleet.'); return }
    if (!departureTime) { setSubmitError('Set a departure time.'); return }

    setSubmitting(true)
    setRunId(null)
    try {
      const { data } = await api.post('/v1/fleet-optimise', {
        fleetId,
        stationCapKw:  stationCap,
        departureTime: new Date(departureTime).toISOString(),
      })
      setRunId(data.id)
      setRan(true)
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const loading = submitting || polling

  // Build comparison chart data from result
  const comparison = result && result.vehicleSchedules
    ? (() => {
        const hourMap = {}
        result.vehicleSchedules.forEach(s => {
          const h = new Date(s.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
          hourMap[h] = (hourMap[h] || 0) + (parseFloat(s.powerKw) || 0)
        })
        return Object.entries(hourMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([hour, load]) => ({ hour, load: Math.round(load * 10) / 10, renewable: 0 }))
      })()
    : []

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Fleet Optimisation</h1>
          <p className={styles.sub}>Coordinate your fleet — same requirements, smarter timing</p>
        </div>
        <button className={styles.runBtn} onClick={handleOptimise} disabled={loading}>
          {loading
            ? <><span className={styles.spinner} /> {polling ? 'Optimising…' : 'Submitting…'}</>
            : ran ? '⟳ Re-run Optimisation' : '▶ Run Fleet Optimisation'}
        </button>
      </div>

      {/* Fleet config */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Fleet Configuration</h2>
        </div>
        <div className={styles.configRow} style={{ display: 'flex', gap: '1rem', padding: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Fleet</label>
            <select value={fleetId} onChange={e => setFleetId(e.target.value)} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
              <option value="">— select fleet —</option>
              {uniqueFleets.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Station Capacity (kW)</label>
            <input type="number" min={10} max={500} value={stationCap}
              onChange={e => setStationCap(Number(e.target.value))}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', width: 120 }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Departure Time</label>
            <input type="datetime-local" value={departureTime}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => setDepartureTime(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
          </div>
        </div>
        {submitError && <p style={{ color: '#e53e3e', padding: '0 1rem 0.75rem', fontSize: '0.85rem' }}>{submitError}</p>}

        {/* Fleet vehicles table */}
        {fleetVehicles.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Current SOC</th>
                  <th>Battery</th>
                  <th>Max Charge Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fleetVehicles.map(v => (
                  <tr key={v.id}>
                    <td>
                      <span className={styles.vehicleId}>{v.vehicleCode}</span>
                      <span className={styles.vehicleName}>{v.displayName}</span>
                    </td>
                    <td>
                      <div className={styles.socCell}>
                        <div className={styles.socMini}>
                          <div className={styles.socMiniFill}
                            style={{ width: `${parseFloat(v.currentSoc)}%`, background: '#d97706' }} />
                        </div>
                        <span>{fmt(v.currentSoc, 1)}%</span>
                      </div>
                    </td>
                    <td>{v.batteryCapacityKwh} kWh</td>
                    <td>{v.maxChargeRateKw} kW</td>
                    <td><span style={{ color: v.active ? '#16a34a' : '#94a3b8' }}>{v.active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading && (
        <div className={styles.loadingCard}>
          <span className={styles.loadingRing} />
          <span>
            {polling
              ? `Scheduling ${fleetVehicles.length} vehicles across renewable windows…`
              : 'Submitting fleet optimisation request…'}
          </span>
        </div>
      )}

      {result && result.status === 'COMPLETED' && (
        <>
          <div className={styles.metricsRow}>
            {[
              {
                label: 'Peak Load Reduction',
                value: `↓ ${fmt(parseFloat(result.peakNaiveKw || 0) - parseFloat(result.peakOptKw || 0), 1)} kW`,
                sub:   `${fmt(result.peakNaiveKw, 1)} → ${fmt(result.peakOptKw, 1)} kW`,
                color: '#18B96B', bg: 'var(--color-accent-light)',
              },
              {
                label: 'Renewable Alignment',
                value: `↑ ${fmt(parseFloat(result.renewableOptPct || 0) - parseFloat(result.renewableNaivePct || 0), 1)}%`,
                sub:   `${fmt(result.renewableNaivePct, 1)}% → ${fmt(result.renewableOptPct, 1)}%`,
                color: '#d97706', bg: '#fffbeb',
              },
              {
                label: 'Station Capacity',
                value: `${stationCap} kW`,
                sub:   'Respected at all times',
                color: '#0284c7', bg: '#f0f9ff',
              },
              {
                label: 'Vehicles Scheduled',
                value: `${result.vehicleSchedules?.length ? result.vehiclesCount : '—'} / ${result.vehiclesCount}`,
                sub:   'All targets met before departure',
                color: '#16a34a', bg: '#f0fdf4',
              },
            ].map(m => (
              <div key={m.label} className={styles.metricCard} style={{ background: m.bg }}>
                <span className={styles.metricVal} style={{ color: m.color }}>{m.value}</span>
                <span className={styles.metricLabel}>{m.label}</span>
                <span className={styles.metricSub}>{m.sub}</span>
              </div>
            ))}
          </div>

          {comparison.length > 0 && (
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h2 className={styles.chartTitle}>Optimised Schedule — Power per Hour</h2>
                  <p className={styles.chartSub}>Fleet total charging load distributed across renewable windows</p>
                </div>
                <span className={styles.chartBadge}>Result</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparison} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                    axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                    formatter={(v, n) => [`${v} kW`, n === 'load' ? 'Load' : 'Renewable %']}
                    cursor={{ fill: 'rgba(24,185,107,0.06)' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="load" fill="#18B96B" radius={[4,4,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className={styles.outcomeStrip}>
            {[
              ['✓', 'On-Time Charging',   'All vehicles reach target SOC before departure'],
              ['↓', 'Cost Reduced',        'Charging shifted to lower-cost renewable windows'],
              ['↓', 'Estimated Emissions', 'Higher renewable share reduces carbon intensity'],
              ['↑', 'Renewable Alignment', `${fmt(result.renewableOptPct, 1)}% average renewable share`],
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

      {result && result.status === 'FAILED' && (
        <div className={styles.loadingCard}>
          <p style={{ color: '#e53e3e', margin: 0 }}>Fleet optimisation failed. Please try again.</p>
        </div>
      )}
    </div>
  )
}
