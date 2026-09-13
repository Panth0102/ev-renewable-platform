import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import styles from './ChargingRequest.module.css'

const SCORE_COLOR = (s) => s >= 80 ? '#18B96B' : s >= 60 ? '#d97706' : '#e53e3e'

// Poll an optimisation request until COMPLETED or FAILED
function usePollOptimisation(requestId) {
  const [result, setResult] = useState(null)
  const [polling, setPolling] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!requestId) return
    setPolling(true)

    const poll = async () => {
      try {
        const { data } = await api.get(`/v1/optimise/${requestId}`)
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
  }, [requestId])

  return { result, polling }
}

// Shape backend OptimisationResponse into the chart/display format
function shapeResult(data) {
  if (!data || data.status === 'FAILED') return null

  const slots = (data.slots || []).map(s => ({
    label: new Date(s.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    power: parseFloat(s.powerKw) || 0,
    renewable: parseFloat(s.renewablePct) || 0,
  }))

  const bestStart = data.bestWindowStart
    ? new Date(data.bestWindowStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—'
  const bestEnd = data.bestWindowEnd
    ? new Date(data.bestWindowEnd).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—'

  return {
    schedule:           slots,
    renewableAlignment: Math.round(parseFloat(data.renewableAlignmentPct) || 0),
    estimatedCost:      Math.round(parseFloat(data.estimatedCostInr) || 0),
    estimatedCo2:       Math.round((parseFloat(data.estimatedCo2Kg) || 0) * 10) / 10,
    greenScore:         data.greenScore ?? 0,
    bestWindow:         `${bestStart} – ${bestEnd}`,
    totalKwh:           Math.round((parseFloat(data.totalEnergyKwh) || 0) * 10) / 10,
    status:             data.status,
    errorMessage:       data.errorMessage,
  }
}

export default function ChargingRequest() {
  const { data: vehicles = [] } = useApi('/v1/vehicles', [])
  const { data: stations = [] } = useApi('/v1/stations', [])

  const [form, setForm] = useState({
    vehicleId:          '',
    stationId:          '',
    currentSoc:         35,
    targetSoc:          90,
    batteryCapacityKwh: 60,
    chargerLimitKw:     22,
    departureTime:      '',
  })

  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState('')
  const [optimiseId, setOptimiseId]     = useState(null)

  const { result: rawResult, polling } = usePollOptimisation(optimiseId)
  const result = rawResult ? shapeResult(rawResult) : null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Default departureTime to 7 hours from now when component loads
  useEffect(() => {
    const d = new Date(Date.now() + 7 * 3600 * 1000)
    d.setSeconds(0, 0)
    setForm(f => ({ ...f, departureTime: d.toISOString().slice(0, 16) }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setOptimiseId(null)

    if (!form.vehicleId) { setSubmitError('Select a vehicle.'); return }
    if (Number(form.targetSoc) <= Number(form.currentSoc)) {
      setSubmitError('Target SOC must be greater than current SOC.')
      return
    }
    if (!form.departureTime) { setSubmitError('Set a departure time.'); return }

    setSubmitting(true)
    try {
      const payload = {
        vehicleId:          form.vehicleId,
        stationId:          form.stationId || undefined,
        currentSoc:         Number(form.currentSoc),
        targetSoc:          Number(form.targetSoc),
        batteryCapacityKwh: Number(form.batteryCapacityKwh),
        chargerLimitKw:     Number(form.chargerLimitKw),
        // Backend expects ISO 8601 Instant string
        departureTime:      new Date(form.departureTime).toISOString(),
      }
      const { data } = await api.post('/v1/optimise', payload)
      setOptimiseId(data.id)
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Submission failed. Check backend connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const loading = submitting || polling
  const scoreColor = result ? SCORE_COLOR(result.greenScore) : '#18B96B'

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Charge request</h1>
          <p className={styles.sub}>
            Enter vehicle state and departure time to get an optimised charging schedule
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── LEFT — form ── */}
        <div className={styles.formCard}>

          {/* Vehicle selector */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Vehicle</h2>
            <div className={styles.field}>
              <label>Select vehicle</label>
              <select value={form.vehicleId} onChange={e => {
                const v = vehicles.find(x => x.id === e.target.value)
                set('vehicleId', e.target.value)
                if (v) {
                  set('batteryCapacityKwh', v.batteryCapacityKwh)
                  set('chargerLimitKw', v.maxChargeRateKw)
                  set('currentSoc', parseFloat(v.currentSoc) || 0)
                }
              }}>
                <option value="">— choose vehicle —</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.displayName} ({v.vehicleCode})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Station (optional)</label>
              <select value={form.stationId} onChange={e => set('stationId', e.target.value)}>
                <option value="">— any station —</option>
                {stations.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SOC */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>State of charge</h2>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Current SOC (%)</label>
                <div className={styles.sliderWrap}>
                  <input type="range" min={0} max={100} value={form.currentSoc}
                    onChange={e => set('currentSoc', e.target.value)} />
                  <span className={styles.sliderVal}>{form.currentSoc}%</span>
                </div>
              </div>
              <div className={styles.field}>
                <label>Target SOC (%)</label>
                <div className={styles.sliderWrap}>
                  <input type="range" min={Number(form.currentSoc) + 1} max={100} value={form.targetSoc}
                    onChange={e => set('targetSoc', e.target.value)} />
                  <span className={styles.sliderVal}>{form.targetSoc}%</span>
                </div>
              </div>
            </div>
            <div className={styles.socBar}>
              <div className={styles.socFill}
                style={{ width: `${form.currentSoc}%`, background: '#d97706' }} />
              <div className={styles.socTarget}
                style={{ left: `${form.currentSoc}%`, width: `${form.targetSoc - form.currentSoc}%` }} />
            </div>
            <div className={styles.socLegend}>
              <span><span className={styles.dot} style={{ background: '#d97706' }} />Current {form.currentSoc}%</span>
              <span><span className={styles.dot} style={{ background: '#18B96B' }} />Target {form.targetSoc}%</span>
            </div>
          </div>

          {/* Vehicle & Charger */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Vehicle &amp; charger</h2>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Battery Capacity (kWh)</label>
                <input type="number" min={10} max={200} value={form.batteryCapacityKwh}
                  onChange={e => set('batteryCapacityKwh', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Charger Limit (kW)</label>
                <input type="number" min={3} max={350} value={form.chargerLimitKw}
                  onChange={e => set('chargerLimitKw', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Departure */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Departure</h2>
            <div className={styles.field}>
              <label>Departure date &amp; time</label>
              <input
                type="datetime-local"
                value={form.departureTime}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => set('departureTime', e.target.value)}
              />
            </div>
          </div>

          {submitError && <p className={styles.errorHint}>{submitError}</p>}

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><span className={styles.spinner} /> {polling ? 'Optimising…' : 'Submitting…'}</>
              : '⚡ Get Optimal Schedule'}
          </button>
        </div>

        {/* ── RIGHT — result ── */}
        <div className={styles.resultPanel}>
          {!result && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔋</div>
              <p className={styles.emptyTitle}>No schedule yet</p>
              <p className={styles.emptySub}>Fill in your EV details and click "Get Optimal Schedule"</p>
            </div>
          )}

          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.loadingRing} />
              <p className={styles.emptyTitle}>
                {polling ? 'Running optimisation…' : 'Submitting request…'}
              </p>
              <p className={styles.emptySub}>Balancing renewable availability, cost and grid load</p>
            </div>
          )}

          {result?.status === 'FAILED' && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle} style={{ color: '#e53e3e' }}>Optimisation failed</p>
              <p className={styles.emptySub}>{result.errorMessage || 'Please try again.'}</p>
            </div>
          )}

          {result && result.status === 'COMPLETED' && (
            <>
              {/* Green Score hero */}
              <div className={styles.scoreCard}>
                <div className={styles.scoreRing} style={{ '--score-color': scoreColor }}>
                  <svg viewBox="0 0 100 100" className={styles.ringsvg}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={scoreColor} strokeWidth="8"
                      strokeDasharray={`${result.greenScore * 2.638} ${263.8}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className={styles.scoreInner}>
                    <span className={styles.scoreNum} style={{ color: scoreColor }}>{result.greenScore}</span>
                    <span className={styles.scoreLbl}>/ 100</span>
                  </div>
                </div>
                <div className={styles.scoreRight}>
                  <p className={styles.scoreTitle}>Green Score</p>
                  <p className={styles.scoreWindow}>
                    Best window: <strong>{result.bestWindow}</strong>
                  </p>
                  <p className={styles.scoreDesc}>
                    {result.greenScore >= 80
                      ? 'Excellent — charging aligns strongly with renewables'
                      : result.greenScore >= 60
                      ? 'Good — moderate renewable alignment'
                      : 'Low — consider charging later for greener energy'}
                  </p>
                </div>
              </div>

              {/* Metric pills */}
              <div className={styles.metricsRow}>
                {[
                  { label: 'Renewable Alignment', value: `${result.renewableAlignment}%`, icon: '☀', color: '#18B96B' },
                  { label: 'Estimated Cost',       value: `₹${result.estimatedCost}`,      icon: '₹', color: '#d97706' },
                  { label: 'Est. Emissions',        value: `${result.estimatedCo2} kg CO₂`, icon: '🌿', color: '#0284c7' },
                  { label: 'Energy to Charge',      value: `${result.totalKwh} kWh`,         icon: '🔋', color: '#6366f1' },
                ].map(m => (
                  <div key={m.label} className={styles.metricCard}>
                    <span className={styles.metricIcon} style={{ color: m.color }}>{m.icon}</span>
                    <span className={styles.metricVal} style={{ color: m.color }}>{m.value}</span>
                    <span className={styles.metricLabel}>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Charging schedule chart */}
              {result.schedule.length > 0 && (
                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <div>
                      <h3 className={styles.chartTitle}>Recommended Charging Window</h3>
                      <p className={styles.chartSub}>Charging power (kW) vs hour — green = renewable %</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={result.schedule} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                        axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                        formatter={(val, name) => [
                          name === 'power' ? `${val} kW` : `${val}%`,
                          name === 'power' ? 'Charging Power' : 'Renewable',
                        ]}
                      />
                      <Bar dataKey="power" radius={[5, 5, 0, 0]} maxBarSize={32}>
                        {result.schedule.map((s, i) => (
                          <Cell key={i}
                            fill={s.power > 0
                              ? `rgba(24,185,107,${0.4 + (s.renewable / 200)})`
                              : 'var(--color-border)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className={styles.outcomeRow}>
                {['✓ On-time charging', '↓ Cost', '↓ Estimated Emissions', '↑ Renewable Alignment'].map(o => (
                  <span key={o} className={styles.outcomeTag}>{o}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
