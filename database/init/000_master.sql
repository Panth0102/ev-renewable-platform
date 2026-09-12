-- ============================================================
-- GreenCharge — Master Database Init Script
-- Runs schema → indexes → seed in one command
--
-- Usage (local):
--   psql -U ev_user -d ev_renewable_db -f database/init/000_master.sql
--
-- Usage (create DB + run, first time setup):
--   psql -U postgres -c "CREATE USER ev_user WITH PASSWORD 'ev_secure_pass_2026';"
--   psql -U postgres -c "CREATE DATABASE ev_renewable_db OWNER ev_user;"
--   psql -U ev_user -d ev_renewable_db -f database/init/000_master.sql
-- ============================================================

\echo '=== Step 1: Schema & Tables ==='
\ir 001_schema.sql

\echo '=== Step 2: Indexes ==='
\ir 002_indexes.sql

\echo '=== Step 3: Seed Data ==='
\ir ../seeds/001_seed_data.sql

\echo ''
\echo '✓ GreenCharge database is ready.'
\echo ''

-- Quick verification: list all created tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
