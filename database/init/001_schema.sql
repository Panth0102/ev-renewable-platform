-- ============================================================
-- GreenCharge — EV Renewable Platform
-- Full database schema for PostgreSQL 15+
--
-- Run with:
--   psql -U ev_user -d ev_renewable_db -f database/init/001_schema.sql
--
-- Or via Docker Compose (runs automatically on first start):
--   docker compose up db
-- ============================================================

-- ── Safety: run idempotently ─────────────────────────────────
SET client_min_messages = WARNING;

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid(), crypt()

-- ============================================================
-- SECTION 1 — ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role         AS ENUM ('ADMIN', 'OPERATOR', 'DRIVER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE station_status    AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OFFLINE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE charger_type      AS ENUM ('AC_SLOW', 'AC_FAST', 'DC_FAST', 'DC_ULTRA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE charger_status    AS ENUM ('AVAILABLE', 'OCCUPIED', 'FAULTED', 'OFFLINE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE session_status    AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'FAULTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type      AS ENUM ('CAR', 'VAN', 'BUS', 'TRUCK', 'TWO_WHEELER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opt_status        AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE energy_source     AS ENUM ('SOLAR', 'WIND', 'HYDRO', 'GRID', 'BATTERY', 'MIXED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- SECTION 2 — USERS & AUTH
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(120)    NOT NULL,
  email               VARCHAR(255)    NOT NULL UNIQUE,
  password_hash       VARCHAR(255)    NOT NULL,
  role                VARCHAR(20)     NOT NULL DEFAULT 'DRIVER',
  organisation        VARCHAR(120),
  phone               VARCHAR(20),
  is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
  email_verified      BOOLEAN         NOT NULL DEFAULT FALSE,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users                IS 'Platform users — operators, drivers and admins';
COMMENT ON COLUMN users.password_hash  IS 'bcrypt hash, never store plaintext';
COMMENT ON COLUMN users.role           IS 'ADMIN: full access | OPERATOR: manage stations | DRIVER: request charging';

-- Refresh tokens (JWT refresh)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECTION 3 — STATIONS & CHARGERS
-- ============================================================

CREATE TABLE IF NOT EXISTS stations (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(120)    NOT NULL,
  city            VARCHAR(80)     NOT NULL,
  state           VARCHAR(80),
  address         TEXT,
  latitude        NUMERIC(10, 7)  NOT NULL,
  longitude       NUMERIC(10, 7)  NOT NULL,
  status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
  total_capacity_kw NUMERIC(8,2)  NOT NULL DEFAULT 0,  -- sum of all charger limits
  operator_id     UUID            REFERENCES users(id) ON DELETE SET NULL,
  timezone        VARCHAR(60)     NOT NULL DEFAULT 'Asia/Kolkata',
  notes           TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stations IS 'Physical EV charging locations with GPS coordinates';

CREATE TABLE IF NOT EXISTS chargers (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id      UUID            NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  charger_code    VARCHAR(40)     NOT NULL UNIQUE,  -- e.g. "ALPHA-01"
  charger_type    VARCHAR(20)     NOT NULL DEFAULT 'AC_FAST',
  power_kw        NUMERIC(8,2)    NOT NULL,         -- max rated power
  status          VARCHAR(20)     NOT NULL DEFAULT 'AVAILABLE',
  connector_type  VARCHAR(30),                      -- CCS2, CHAdeMO, Type2, etc.
  ocpp_id         VARCHAR(80),                      -- OCPP station ID (future)
  is_smart        BOOLEAN         NOT NULL DEFAULT TRUE,  -- supports managed charging
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chargers IS 'Individual charger units within a station';

-- ============================================================
-- SECTION 4 — VEHICLES & FLEETS
-- ============================================================

CREATE TABLE IF NOT EXISTS fleets (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(120) NOT NULL,
  owner_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fleets IS 'Groups of vehicles managed together for fleet optimisation';

CREATE TABLE IF NOT EXISTS vehicles (
  id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  fleet_id            UUID            REFERENCES fleets(id) ON DELETE SET NULL,
  owner_id            UUID            REFERENCES users(id) ON DELETE SET NULL,
  vehicle_code        VARCHAR(40)     NOT NULL UNIQUE,  -- e.g. "V-001"
  display_name        VARCHAR(80)     NOT NULL,
  vehicle_type        VARCHAR(20)     NOT NULL DEFAULT 'CAR',
  make                VARCHAR(60),
  model               VARCHAR(60),
  battery_capacity_kwh NUMERIC(7,2)  NOT NULL,          -- total usable capacity
  max_charge_rate_kw  NUMERIC(7,2)   NOT NULL,          -- onboard charger limit
  current_soc         NUMERIC(5,2)   NOT NULL DEFAULT 0 CHECK (current_soc BETWEEN 0 AND 100),
  is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vehicles  IS 'EV vehicles registered on the platform';
COMMENT ON COLUMN vehicles.current_soc IS 'Last known state of charge 0-100%';

-- ============================================================
-- SECTION 5 — ENERGY SIGNALS (external data cache)
-- ============================================================

CREATE TABLE IF NOT EXISTS energy_signals (
  id                  BIGSERIAL       PRIMARY KEY,
  signal_time         TIMESTAMPTZ     NOT NULL,           -- hour the signal applies to
  source              VARCHAR(20)     NOT NULL DEFAULT 'MIXED',
  renewable_pct       NUMERIC(5,2)    NOT NULL DEFAULT 0 CHECK (renewable_pct BETWEEN 0 AND 100),
  carbon_intensity_gco2_kwh NUMERIC(8,2),                -- gCO₂/kWh
  electricity_price_per_kwh NUMERIC(8,4),                -- ₹/kWh
  grid_load_pct       NUMERIC(5,2)    CHECK (grid_load_pct BETWEEN 0 AND 100),
  solar_forecast_kw   NUMERIC(10,2),
  wind_forecast_kw    NUMERIC(10,2),
  fetched_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (signal_time, source)
);

COMMENT ON TABLE energy_signals IS 'Hourly renewable availability, carbon intensity and price signals';

-- ============================================================
-- SECTION 6 — OPTIMISATION REQUESTS & SCHEDULES
-- ============================================================

CREATE TABLE IF NOT EXISTS optimisation_requests (
  id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id          UUID            NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  station_id          UUID            REFERENCES stations(id) ON DELETE SET NULL,
  charger_id          UUID            REFERENCES chargers(id) ON DELETE SET NULL,
  requested_by        UUID            REFERENCES users(id) ON DELETE SET NULL,

  -- EV state at request time
  current_soc         NUMERIC(5,2)    NOT NULL CHECK (current_soc BETWEEN 0 AND 100),
  target_soc          NUMERIC(5,2)    NOT NULL CHECK (target_soc  BETWEEN 0 AND 100),
  battery_capacity_kwh NUMERIC(7,2)  NOT NULL,
  charger_limit_kw    NUMERIC(7,2)   NOT NULL,
  departure_time      TIMESTAMPTZ    NOT NULL,

  -- Result
  status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
  green_score         SMALLINT       CHECK (green_score BETWEEN 0 AND 100),
  renewable_alignment_pct NUMERIC(5,2),
  estimated_cost_inr  NUMERIC(10,2),
  estimated_co2_kg    NUMERIC(8,3),
  best_window_start   TIMESTAMPTZ,
  best_window_end     TIMESTAMPTZ,
  total_energy_kwh    NUMERIC(8,3),
  error_message       TEXT,

  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

COMMENT ON TABLE optimisation_requests IS 'Single-EV charging optimisation requests and their results';

CREATE TABLE IF NOT EXISTS optimisation_schedule_slots (
  id              BIGSERIAL       PRIMARY KEY,
  request_id      UUID            NOT NULL REFERENCES optimisation_requests(id) ON DELETE CASCADE,
  slot_start      TIMESTAMPTZ     NOT NULL,
  slot_end        TIMESTAMPTZ     NOT NULL,
  power_kw        NUMERIC(7,2)    NOT NULL DEFAULT 0,
  renewable_pct   NUMERIC(5,2),
  slot_order      SMALLINT        NOT NULL
);

COMMENT ON TABLE optimisation_schedule_slots IS 'Hourly power slots that make up an optimised charging schedule';

-- Fleet optimisation
CREATE TABLE IF NOT EXISTS fleet_optimisation_runs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  fleet_id        UUID        REFERENCES fleets(id) ON DELETE SET NULL,
  requested_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
  station_cap_kw  NUMERIC(8,2) NOT NULL,
  peak_naive_kw   NUMERIC(8,2),
  peak_opt_kw     NUMERIC(8,2),
  renewable_naive_pct NUMERIC(5,2),
  renewable_opt_pct   NUMERIC(5,2),
  vehicles_count  SMALLINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE fleet_optimisation_runs IS 'Multi-vehicle fleet scheduling runs';

CREATE TABLE IF NOT EXISTS fleet_vehicle_schedules (
  id              BIGSERIAL   PRIMARY KEY,
  run_id          UUID        NOT NULL REFERENCES fleet_optimisation_runs(id) ON DELETE CASCADE,
  vehicle_id      UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  slot_start      TIMESTAMPTZ NOT NULL,
  slot_end        TIMESTAMPTZ NOT NULL,
  power_kw        NUMERIC(7,2) NOT NULL DEFAULT 0,
  renewable_pct   NUMERIC(5,2),
  slot_order      SMALLINT    NOT NULL
);

COMMENT ON TABLE fleet_vehicle_schedules IS 'Per-vehicle per-hour slots from a fleet optimisation run';

-- ============================================================
-- SECTION 7 — CHARGING SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS charging_sessions (
  id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id          UUID            NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  charger_id          UUID            NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
  station_id          UUID            NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  user_id             UUID            REFERENCES users(id) ON DELETE SET NULL,
  opt_request_id      UUID            REFERENCES optimisation_requests(id) ON DELETE SET NULL,

  status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
  soc_start           NUMERIC(5,2)    CHECK (soc_start BETWEEN 0 AND 100),
  soc_end             NUMERIC(5,2)    CHECK (soc_end   BETWEEN 0 AND 100),
  energy_delivered_kwh NUMERIC(10,3),
  avg_power_kw        NUMERIC(7,2),
  peak_power_kw       NUMERIC(7,2),
  renewable_pct       NUMERIC(5,2),
  cost_inr            NUMERIC(10,2),
  co2_saved_kg        NUMERIC(8,3),
  green_score         SMALLINT        CHECK (green_score BETWEEN 0 AND 100),

  started_at          TIMESTAMPTZ,
  ended_at            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE charging_sessions IS 'Individual EV charging session records with energy and cost metrics';

-- ============================================================
-- SECTION 8 — AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL   PRIMARY KEY,
  actor_id    UUID,                   -- No FK to users so deleting users preserves audit log
  action      VARCHAR(80) NOT NULL,   -- e.g. 'SESSION_START', 'STATION_UPDATE'
  entity_type VARCHAR(60),            -- e.g. 'charging_sessions'
  entity_id   TEXT,                   -- UUID or other PK as text
  detail      TEXT,                   -- arbitrary change data (JSON string)
  ip_address  VARCHAR(45),            -- IPv4 or IPv6 as plain text
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Immutable audit trail for all significant platform actions';

-- ============================================================
-- SECTION 9 — TRIGGERS (auto-update updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'stations', 'chargers', 'fleets',
    'vehicles', 'charging_sessions'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I;
       CREATE TRIGGER set_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- SECTION 10 — VIEWS
-- ============================================================

-- Station live summary
CREATE OR REPLACE VIEW v_station_summary AS
SELECT
  s.id,
  s.name,
  s.city,
  s.status,
  s.total_capacity_kw,
  COUNT(c.id)                                         AS charger_count,
  COUNT(c.id) FILTER (WHERE c.status = 'AVAILABLE')  AS available_chargers,
  COUNT(c.id) FILTER (WHERE c.status = 'OCCUPIED')   AS occupied_chargers,
  COALESCE(SUM(cs.energy_delivered_kwh)
    FILTER (WHERE cs.started_at::date = CURRENT_DATE), 0) AS energy_today_kwh
FROM stations        s
LEFT JOIN chargers   c  ON c.station_id = s.id
LEFT JOIN charging_sessions cs ON cs.station_id = s.id
GROUP BY s.id, s.name, s.city, s.status, s.total_capacity_kw;

COMMENT ON VIEW v_station_summary IS 'Live per-station metrics used by the dashboard';

-- Dashboard KPI snapshot
CREATE OR REPLACE VIEW v_dashboard_kpi AS
SELECT
  (SELECT COUNT(*) FROM stations  WHERE status = 'ACTIVE')              AS active_stations,
  (SELECT COUNT(*) FROM charging_sessions WHERE status = 'ACTIVE')       AS active_sessions,
  (SELECT COALESCE(SUM(energy_delivered_kwh), 0)
   FROM charging_sessions
   WHERE started_at::date = CURRENT_DATE)                                AS energy_today_kwh,
  (SELECT COALESCE(AVG(renewable_pct), 0)
   FROM charging_sessions
   WHERE started_at::date = CURRENT_DATE)                                AS solar_share_pct,
  (SELECT COALESCE(SUM(co2_saved_kg), 0)
   FROM charging_sessions
   WHERE DATE_TRUNC('month', started_at) = DATE_TRUNC('month', NOW()))   AS co2_saved_month_kg;

COMMENT ON VIEW v_dashboard_kpi IS 'Single-row KPI snapshot for the operator dashboard';

-- ============================================================
-- DONE
-- ============================================================
SELECT 'GreenCharge schema created successfully.' AS status;
