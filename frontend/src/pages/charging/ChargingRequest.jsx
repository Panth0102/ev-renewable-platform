import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import styles from './ChargingRequest.module.css'

// Simulate the optimization engine output
function runOptimizer(form) {
  const socNeeded = form.targetSoc - form.currentSoc          // % to fill
  const batteryKwh = (socNeeded / 100) * form.batteryCapacity  // kWh required
  const hoursAvail = form.departureHour - new Date().getHours()
  const safeHours = Math.max(hoursAvail, 2)

  // Renewable availability curve (0-23h), peaks midday
  const renewableCurve = [
    0, 0, 0, 0, 5, 10, 25, 45, 65, 82, 90, 95,
    95, 88, 78, 65, 45, 25, 10, 5, 2, 0, 0, 0,
  ]

  // Build hourly schedule — prefer high-renewable windows
  const now = new Date().getHours()
  const hours = []
  for (let h = now; h < form.departureHour; h++) {
    hours.push({ hour: h, renewable: renewableCurve[h % 24] })
  }
  // Sort by renewable desc to find best windows
  const sorted = [...hours].sort((a, b) => b.renewable - a.renewable)

  // Assign charging power per slot (max charger limit kW)
  const slotSize = 1 // 1 hour slots
  let remaining = batteryKwh
  const schedule = hours.map(h => ({ ...h, power: 0 }))

  for (const best of sorted) {
    if (remaining <= 0) break
    const idx = schedule.findIndex(s => s.hour === best.hour)
    const power = Math.min(form.chargerLimit, remaining / slotSize)
    schedule[idx].power = Math.round(power * 10) / 10
    remaining -= power * slotSize
  }

  // Compute metrics
  const totalCharged = schedule.reduce((s, h) => s + h.power, 0)
  const weightedRenewable = schedule.reduce((s, h) => s + h.power * h.renewable, 0)
  const renewableAlignment = totalCharged > 0 ? Math.round(weightedRenewable / totalCharged) : 0
  const estimatedCost = Math.round(totalCharged * 8.5)   // ₹8.5/kWh avg
  const estimatedCo2 = Math.round(totalCharged * (1 - renewableAlignment / 100) * 0.82 * 10) / 10
  const greenScore = Math.min(100, Math.round(
    renewableAlignment * 0.5 +
    (1 - estimatedCo2 / (batteryKwh * 0.82)) * 30 +
    (safeHours > 4 ? 20 : 10)
  ))

  // Best window label
  const bestSlots = schedule.filter(s => s.power > 0).sort((a, b) => b.renewable - a.renewable)
  const bestStart = bestSlots[0]?.hour ?? now
  const bestEnd = (bestSlots[bestSlots.length - 1]?.hour ?? now) + 1
  const fmt = h => `${String(h % 24).padStart(2, '0')}:00`

  return {
    schedule: schedule.map(s => ({
      label: fmt(s.hour),
      power: s.power,
      renewable: s.renewable,
    })),
    renewableAlignment,
    estimatedCost,
    estimatedCo2,
    greenScore,
    bestWindow: `${fmt(bestStart)} – ${fmt(bestEnd)}`,
    totalKwh: Math.round(totalCharged * 10) / 10,
  }
}

const SCORE_COLOR = (s) => s >= 80 ? '#18B96B' : s >= 60 ? '#d97706' : '#e53e3e'

export default function ChargingRequest() {
  const [form, setForm] = useState({
    currentSoc: 35,
    targetSoc: 90,
    batteryCapacity: 60,
    departureHour: 7,
    chargerLimit: 22,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: Number(v) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    // Simulate async call to optimizer
    setTimeout(() => {
      setResult(runOptimizer(form))
      setLoading(false)
    }, 900)
  }

  const scoreColor = result ? SCORE_COLOR(result.greenScore) : '#18B96B'

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Charging Request</h1>
          <p className={styles.sub}>
            Submit your EV details and get an optimised charging schedule
          </p>
        </div>
        <span className={styles.badge}>🤖 AI Optimised</span>
      </div>

      <div className={styles.layout}>
        {/* ── LEFT — form ── */}
        <div className={styles.formCard}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionNum}>01</span> EV State
            </h2>
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
                  <input type="range" min={form.currentSoc + 1} max={100} value={form.targetSoc}
                    onChange={e => set('targetSoc', e.target.value)} />
                  <span className={styles.sliderVal}>{form.targetSoc}%</span>
                </div>
              </div>
            </div>
            <div className={styles.socBar}>
              <div className={styles.socFill}
                style={{ width: `${form.currentSoc}%`, background: '#d97706' }}
                title={`Current: ${form.currentSoc}%`}
              />
              <div className={styles.socTarget}
                style={{
                  left: `${form.currentSoc}%`,
                  width: `${form.targetSoc - form.currentSoc}%`,
                }}
                title={`To charge: ${form.targetSoc - form.currentSoc}%`}
              />
            </div>
            <div className={styles.socLegend}>
              <span><span className={styles.dot} style={{ background: '#d97706' }} />Current {form.currentSoc}%</span>
              <span><span className={styles.dot} style={{ background: '#18B96B' }} />Target {form.targetSoc}%</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                Need: {form.targetSoc - form.currentSoc}%
              </span>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionNum}>02</span> Vehicle &amp; Charger
            </h2>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Battery Capacity (kWh)</label>
                <input type="number" min={10} max={200} value={form.batteryCapacity}
                  onChange={e => set('batteryCapacity', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Charger Limit (kW)</label>
                <input type="number" min={3} max={350} value={form.chargerLimit}
                  onChange={e => set('chargerLimit', e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionNum}>03</span> Departure
            </h2>
            <div className={styles.field}>
              <label>Departure time (hour, 0–23)</label>
              <div className={styles.sliderWrap}>
                <input type="range" min={new Date().getHours() + 1} max={23}
                  value={form.departureHour}
                  onChange={e => set('departureHour', e.target.value)} />
                <span className={styles.sliderVal}>
                  {String(form.departureHour).padStart(2, '0')}:00
                </span>
              </div>
            </div>
          </div>

          <div className={styles.hardConstraint}>
            <span>⚠</span>
            <span>
              <strong>HARD CONSTRAINT</strong> — Schedule will always reach target SOC before departure.
            </span>
          </div>

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading || form.targetSoc <= form.currentSoc}
          >
            {loading
              ? <><span className={styles.spinner} /> Optimising…</>
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
              <p className={styles.emptyTitle}>Running optimisation…</p>
              <p className={styles.emptySub}>Balancing renewable availability, cost and grid load</p>
            </div>
          )}

          {result && (
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

              {/* Outcome tags */}
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
