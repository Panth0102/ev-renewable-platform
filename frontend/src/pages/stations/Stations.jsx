import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import styles from './Stations.module.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATIONS = [
  { id: 1, name: 'Station Alpha',   lat: 23.0225, lng: 72.5714, status: 'active',   city: 'Ahmedabad', power: '22 kW', sessions: 24, energy: '180 kWh' },
  { id: 2, name: 'Station Beta',    lat: 19.0760, lng: 72.8777, status: 'active',   city: 'Mumbai',    power: '50 kW', sessions: 18, energy: '135 kWh' },
  { id: 3, name: 'Station Gamma',   lat: 28.6139, lng: 77.2090, status: 'inactive', city: 'Delhi',     power: '22 kW', sessions: 0,  energy: '0 kWh'   },
  { id: 4, name: 'Station Delta',   lat: 12.9716, lng: 77.5946, status: 'active',   city: 'Bangalore', power: '50 kW', sessions: 31, energy: '240 kWh' },
  { id: 5, name: 'Station Epsilon', lat: 17.3850, lng: 78.4867, status: 'charging', city: 'Hyderabad', power: '11 kW', sessions: 12, energy: '95 kWh'  },
]

const STATUS = {
  active:   { color: '#16a34a', bg: '#f0fdf4', label: 'Active'     },
  inactive: { color: '#94a3b8', bg: '#f8fafc', label: 'Offline'    },
  charging: { color: '#d97706', bg: '#fffbeb', label: 'Charging'   },
}

const SUMMARY = [
  { label: 'Total Stations', value: '5',       icon: '⚡' },
  { label: 'Online',         value: '4',        icon: '✓'  },
  { label: 'Charging Now',   value: '1',        icon: '🔌' },
  { label: 'Total Energy',   value: '650 kWh',  icon: '☀'  },
]

export default function Stations() {
  const [selected, setSelected] = useState(null)
  const center = [
    parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || 20.5937),
    parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || 78.9629),
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>EV Stations</h1>
          <p className={styles.sub}>Manage and monitor all charging locations</p>
        </div>
        <button className={styles.addBtn}>+ Add Station</button>
      </div>

      {/* summary strip */}
      <div className={styles.summaryRow}>
        {SUMMARY.map(s => (
          <div key={s.label} className={styles.summaryCard}>
            <span className={styles.summaryIcon}>{s.icon}</span>
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
            {STATIONS.map((s) => (
              <Marker key={s.id} position={[s.lat, s.lng]} eventHandlers={{ click: () => setSelected(s.id) }}>
                <Popup>
                  <div style={{ minWidth: 140 }}>
                    <strong style={{ color: '#063B32' }}>{s.name}</strong><br />
                    <span style={{ fontSize: '0.8rem', color: '#3d7a65' }}>{s.city}</span><br />
                    <span style={{ color: STATUS[s.status].color, fontWeight: 600, fontSize: '0.82rem' }}>
                      ● {STATUS[s.status].label}
                    </span><br />
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Power: {s.power}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* station list */}
        <div className={styles.listPanel}>
          <p className={styles.listTitle}>{STATIONS.length} Stations</p>
          <ul className={styles.list}>
            {STATIONS.map((s) => {
              const st = STATUS[s.status]
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
                    <span>⚡ {s.power}</span>
                  </div>
                  {selected === s.id && (
                    <div className={styles.itemExpanded}>
                      <div className={styles.expandStat}>
                        <span>{s.sessions}</span><span>Sessions</span>
                      </div>
                      <div className={styles.expandStat}>
                        <span>{s.energy}</span><span>Delivered</span>
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
