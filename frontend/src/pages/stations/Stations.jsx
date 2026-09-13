import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useApi } from '../../hooks/useApi.js'
import styles from './Stations.module.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS = {
  ACTIVE:      { color: '#16a34a', bg: '#f0fdf4', label: 'Active'      },
  INACTIVE:    { color: '#94a3b8', bg: '#f8fafc', label: 'Offline'     },
  MAINTENANCE: { color: '#d97706', bg: '#fffbeb', label: 'Maintenance' },
  OFFLINE:     { color: '#e53e3e', bg: '#fff5f5', label: 'Offline'     },
}

function statusInfo(s) {
  return STATUS[s] || STATUS.OFFLINE
}

export default function Stations() {
  const [selected, setSelected] = useState(null)
  const { data: stations = [], loading, error } = useApi('/v1/stations', [])

  const center = [
    parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || 20.5937),
    parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || 78.9629),
  ]

  const summary = [
    { label: 'Total stations', value: stations.length,                                    icon: null },
    { label: 'Active',         value: stations.filter(s => s.status === 'ACTIVE').length, icon: null },
    { label: 'Chargers',       value: stations.reduce((n, s) => n + (s.chargers?.length ?? 0), 0), icon: null },
    { label: 'Total capacity', value: `${stations.reduce((n, s) => n + (parseFloat(s.totalCapacityKw) || 0), 0).toFixed(0)} kW`, icon: null },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Charging stations</h1>
          <p className={styles.sub}>Network status and station overview</p>
        </div>
        <button className={styles.addBtn}>+ Add station</button>
      </div>

      {loading && <p className={styles.hint}>Loading stations…</p>}
      {error   && <p className={styles.errorHint}>Could not load stations: {error}</p>}

      {/* summary strip */}
      <div className={styles.summaryRow}>
        {summary.map(s => (
          <div key={s.label} className={styles.summaryCard}>
            <div>
              <div className={styles.summaryVal}>{s.value}</div>
              <div className={styles.summaryLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.layout}>
        {/* Map */}
        <div className={styles.mapWrapper}>
          <MapContainer
            center={center}
            zoom={parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM || 5)}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url={import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
              attribution="© OpenStreetMap contributors"
            />
            {stations
              .filter(s => s.latitude != null && s.longitude != null)
              .map((s) => {
                const st = statusInfo(s.status)
                return (
                  <Marker
                    key={s.id}
                    position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                    eventHandlers={{ click: () => setSelected(s.id) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 140 }}>
                        <strong style={{ color: '#063B32' }}>{s.name}</strong><br />
                        <span style={{ fontSize: '0.8rem', color: '#3d7a65' }}>{s.city}</span><br />
                        <span style={{ color: st.color, fontWeight: 600, fontSize: '0.82rem' }}>
                          ● {st.label}
                        </span><br />
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Capacity: {s.totalCapacityKw} kW
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
          </MapContainer>
        </div>

        {/* station list */}
        <div className={styles.listPanel}>
          <p className={styles.listTitle}>{stations.length} Stations</p>
          <ul className={styles.list}>
            {stations.map((s) => {
              const st = statusInfo(s.status)
              return (
                <li
                  key={s.id}
                  className={`${styles.item} ${selected === s.id ? styles.itemSelected : ''}`}
                  onClick={() => setSelected(selected === s.id ? null : s.id)}
                >
                  <div className={styles.itemTop}>
                    <span className={styles.itemName}>{s.name}</span>
                    <span className={styles.badge} style={{ background: st.bg, color: st.color }}>
                      ● {st.label}
                    </span>
                  </div>
                  <div className={styles.itemMeta}>
                    <span>📍 {s.city}</span>
                    <span>⚡ {s.totalCapacityKw} kW</span>
                  </div>
                  {selected === s.id && (
                    <div className={styles.itemExpanded}>
                      <div className={styles.expandStat}>
                        <span>{s.chargers?.length ?? 0}</span><span>Chargers</span>
                      </div>
                      <div className={styles.expandStat}>
                        <span>{s.chargers?.filter(c => c.status === 'AVAILABLE').length ?? 0}</span>
                        <span>Available</span>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
