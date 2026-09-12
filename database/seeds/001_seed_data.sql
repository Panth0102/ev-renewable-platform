-- ============================================================
-- GreenCharge — Development Seed Data
-- Run AFTER 001_schema.sql and 002_indexes.sql
--
--   psql -U ev_user -d ev_renewable_db -f database/seeds/001_seed_data.sql
-- ============================================================

SET client_min_messages = WARNING;

-- ── Users ────────────────────────────────────────────────────
-- Passwords (bcrypt rounds=12):
--   admin@evrenewable.com  → admin123
--   priya@evrenewable.com  → operator123
--   rahul@driver.com       → driver123
--   ananya@driver.com      → driver123
INSERT INTO users (id, name, email, password_hash, role, organisation, is_active, email_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin',        'admin@evrenewable.com', '$2b$12$/uXhAWligVszaWrFgYSTz.mzGe/r7mK6ItReOesXRVmllAak.KTMi', 'ADMIN',    'GreenCharge HQ', TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Priya Sharma', 'priya@evrenewable.com', '$2b$12$R06w9RVOb0kiFHiQPW0PveBgeu80zthngIo6lCHqzzHeM3QBRTM1O', 'OPERATOR', 'GreenCharge HQ', TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Rahul Verma',  'rahul@driver.com',      '$2b$12$wgveyUMwJ2Q73PBPb/I3KOAkvAhd7CuVbFQ6SwsVtIGZ2NnWyY5qq', 'DRIVER',   NULL,             TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000004', 'Ananya Patel', 'ananya@driver.com',     '$2b$12$wgveyUMwJ2Q73PBPb/I3KOAkvAhd7CuVbFQ6SwsVtIGZ2NnWyY5qq', 'DRIVER',   NULL,             TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── Stations ─────────────────────────────────────────────────
INSERT INTO stations (id, name, city, state, address, latitude, longitude, status, total_capacity_kw, operator_id, timezone) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Station Alpha',   'Ahmedabad', 'Gujarat',     'SG Highway, Bodakdev',          23.0225,  72.5714, 'ACTIVE',      72.0,  '00000000-0000-0000-0000-000000000002', 'Asia/Kolkata'),
  ('10000000-0000-0000-0000-000000000002', 'Station Beta',    'Mumbai',    'Maharashtra', 'BKC, Bandra East',              19.0760,  72.8777, 'ACTIVE',     150.0,  '00000000-0000-0000-0000-000000000002', 'Asia/Kolkata'),
  ('10000000-0000-0000-0000-000000000003', 'Station Gamma',   'Delhi',     'Delhi',       'Connaught Place, CP',           28.6139,  77.2090, 'MAINTENANCE',  44.0,  '00000000-0000-0000-0000-000000000002', 'Asia/Kolkata'),
  ('10000000-0000-0000-0000-000000000004', 'Station Delta',   'Bangalore', 'Karnataka',   'Koramangala, 5th Block',        12.9716,  77.5946, 'ACTIVE',     150.0,  '00000000-0000-0000-0000-000000000002', 'Asia/Kolkata'),
  ('10000000-0000-0000-0000-000000000005', 'Station Epsilon', 'Hyderabad', 'Telangana',   'Hitech City, Madhapur',         17.3850,  78.4867, 'ACTIVE',      33.0,  '00000000-0000-0000-0000-000000000002', 'Asia/Kolkata')
ON CONFLICT (id) DO NOTHING;

-- ── Chargers ─────────────────────────────────────────────────
INSERT INTO chargers (id, station_id, charger_code, charger_type, power_kw, status, connector_type, is_smart) VALUES
  -- Station Alpha (22kW x3 = 66kW, 1 DC fast)
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ALPHA-01', 'AC_FAST',  22.0, 'AVAILABLE', 'Type2',  TRUE),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'ALPHA-02', 'AC_FAST',  22.0, 'OCCUPIED',  'Type2',  TRUE),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'ALPHA-03', 'AC_FAST',  22.0, 'AVAILABLE', 'Type2',  TRUE),
  -- Station Beta (50kW DC x3)
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'BETA-01',  'DC_FAST',  50.0, 'AVAILABLE', 'CCS2',   TRUE),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'BETA-02',  'DC_FAST',  50.0, 'OCCUPIED',  'CCS2',   TRUE),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'BETA-03',  'DC_FAST',  50.0, 'AVAILABLE', 'CCS2',   TRUE),
  -- Station Gamma (maintenance)
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'GAMMA-01', 'AC_FAST',  22.0, 'OFFLINE',   'Type2',  TRUE),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'GAMMA-02', 'AC_FAST',  22.0, 'OFFLINE',   'Type2',  TRUE),
  -- Station Delta (50kW x3)
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', 'DELTA-01', 'DC_FAST',  50.0, 'AVAILABLE', 'CCS2',   TRUE),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 'DELTA-02', 'DC_FAST',  50.0, 'OCCUPIED',  'CCS2',   TRUE),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'DELTA-03', 'DC_FAST',  50.0, 'AVAILABLE', 'CCS2',   TRUE),
  -- Station Epsilon (11kW x3)
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', 'EPS-01',   'AC_SLOW',  11.0, 'OCCUPIED',  'Type2',  TRUE),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', 'EPS-02',   'AC_SLOW',  11.0, 'AVAILABLE', 'Type2',  TRUE),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000005', 'EPS-03',   'AC_SLOW',  11.0, 'AVAILABLE', 'Type2',  TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── Fleet & Vehicles ─────────────────────────────────────────
INSERT INTO fleets (id, name, owner_id, description) VALUES
  ('30000000-0000-0000-0000-000000000001', 'GreenCharge Demo Fleet', '00000000-0000-0000-0000-000000000002', 'Demo fleet for HackOut 2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicles (id, fleet_id, owner_id, vehicle_code, display_name, vehicle_type, make, model, battery_capacity_kwh, max_charge_rate_kw, current_soc) VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'V-001', 'Bus #1',  'BUS',   'Tata',    'Starbus EV',  120.0, 50.0, 40.0),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'V-002', 'Bus #2',  'BUS',   'Tata',    'Starbus EV',  120.0, 50.0, 25.0),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'V-003', 'Van #1',  'VAN',   'Mahindra','eSupro',        60.0, 22.0, 55.0),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'V-004', 'Van #2',  'VAN',   'Mahindra','eSupro',        60.0, 22.0, 30.0),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'V-005', 'Car #1',  'CAR',   'Tata',    'Nexon EV',     45.0, 11.0, 20.0)
ON CONFLICT (id) DO NOTHING;

-- ── Energy Signals (last 24h simulated data) ─────────────────
INSERT INTO energy_signals (signal_time, source, renewable_pct, carbon_intensity_gco2_kwh, electricity_price_per_kwh, grid_load_pct, solar_forecast_kw)
SELECT
  NOW() - INTERVAL '1 hour' * gs.h,
  'MIXED',
  CASE
    WHEN (EXTRACT(HOUR FROM NOW()) - gs.h)::int % 24 BETWEEN 8  AND 16 THEN 65 + random() * 30
    WHEN (EXTRACT(HOUR FROM NOW()) - gs.h)::int % 24 BETWEEN 17 AND 20 THEN 20 + random() * 20
    ELSE                                                                      5  + random() * 10
  END,
  320 - random() * 80,
  CASE
    WHEN (EXTRACT(HOUR FROM NOW()) - gs.h)::int % 24 BETWEEN 8 AND 16 THEN 6.5 + random() * 1.5
    ELSE                                                                     8.0 + random() * 2.0
  END,
  40 + random() * 45,
  CASE
    WHEN (EXTRACT(HOUR FROM NOW()) - gs.h)::int % 24 BETWEEN 8 AND 16 THEN 80 + random() * 40
    ELSE                                                                     0
  END
FROM generate_series(0, 23) AS gs(h)
ON CONFLICT (signal_time, source) DO NOTHING;

-- ── Sample charging sessions ──────────────────────────────────
INSERT INTO charging_sessions
  (id, vehicle_id, charger_id, station_id, user_id, status,
   soc_start, soc_end, energy_delivered_kwh, avg_power_kw,
   renewable_pct, cost_inr, co2_saved_kg, green_score,
   started_at, ended_at)
VALUES
  ('50000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000012',
   '10000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000003',
   'COMPLETED', 20, 80, 27.0, 11.0, 72.0, 229.5, 6.1, 87,
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),

  ('50000000-0000-0000-0000-000000000002',
   '40000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000003',
   'ACTIVE', 55, NULL, NULL, 50.0, 68.0, NULL, NULL, NULL,
   NOW() - INTERVAL '45 minutes', NULL)
ON CONFLICT (id) DO NOTHING;

SELECT 'GreenCharge seed data inserted successfully.' AS status;
