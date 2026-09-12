-- ============================================================
-- GreenCharge — Indexes
-- Run AFTER 001_schema.sql
--
--   psql -U ev_user -d ev_renewable_db -f database/init/002_indexes.sql
-- ============================================================

SET client_min_messages = WARNING;

-- ── users ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ── stations ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stations_status    ON stations(status);
CREATE INDEX IF NOT EXISTS idx_stations_operator  ON stations(operator_id);
-- Spatial index for map queries (nearest stations)
CREATE INDEX IF NOT EXISTS idx_stations_location  ON stations(latitude, longitude);

-- ── chargers ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chargers_station   ON chargers(station_id);
CREATE INDEX IF NOT EXISTS idx_chargers_status    ON chargers(status);

-- ── vehicles ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicles_fleet     ON vehicles(fleet_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner     ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_code      ON vehicles(vehicle_code);

-- ── energy_signals ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_energy_signals_time   ON energy_signals(signal_time DESC);
CREATE INDEX IF NOT EXISTS idx_energy_signals_source ON energy_signals(source, signal_time DESC);

-- ── optimisation_requests ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_opt_req_vehicle    ON optimisation_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_opt_req_status     ON optimisation_requests(status);
CREATE INDEX IF NOT EXISTS idx_opt_req_created    ON optimisation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opt_slots_request  ON optimisation_schedule_slots(request_id);

-- ── fleet optimisation ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fleet_runs_fleet   ON fleet_optimisation_runs(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fleet_schedules_run ON fleet_vehicle_schedules(run_id);
CREATE INDEX IF NOT EXISTS idx_fleet_schedules_veh ON fleet_vehicle_schedules(vehicle_id);

-- ── charging_sessions ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_vehicle   ON charging_sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sessions_charger   ON charging_sessions(charger_id);
CREATE INDEX IF NOT EXISTS idx_sessions_station   ON charging_sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user      ON charging_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status    ON charging_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started   ON charging_sessions(started_at DESC);
-- Date-range queries (dashboard: energy today, week, month)
-- Use a plain btree on started_at; range queries on Instant work without a functional index
CREATE INDEX IF NOT EXISTS idx_sessions_started_brin ON charging_sessions USING brin(started_at);

-- ── audit_log ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_actor        ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created      ON audit_log(created_at DESC);
-- Plain btree on detail text (GIN on plain text requires pg_trgm + explicit cast — skip for simplicity)

SELECT 'GreenCharge indexes created successfully.' AS status;
