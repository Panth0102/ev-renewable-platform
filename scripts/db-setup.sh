#!/usr/bin/env zsh
# ============================================================
# GreenCharge — One-command database setup
#
# Usage:
#   chmod +x scripts/db-setup.sh
#   ./scripts/db-setup.sh                         # full setup + seed
#   ./scripts/db-setup.sh --no-seed               # schema + indexes only
#   PGPASSWORD=mypass ./scripts/db-setup.sh       # non-interactive
# ============================================================

set -e

# ── Config ───────────────────────────────────────────────────
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="ev_renewable_db"
DB_SUPERUSER="postgres"       # your PostgreSQL superuser
APP_USER="ev_user"            # app-level user the backend connects as
APP_PASS="ev_secure_pass_2026"
NO_SEED="${1:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")/../database" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║    GreenCharge — Database Setup                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo "  Host:      $DB_HOST:$DB_PORT"
echo "  Database:  $DB_NAME"
echo "  Superuser: $DB_SUPERUSER"
echo "  App user:  $APP_USER"
echo ""

# ── Prompt once for the postgres password if not already set ─
if [[ -z "$PGPASSWORD" ]]; then
  echo -n "  Enter password for PostgreSQL user '$DB_SUPERUSER': "
  read -rs PGPASSWORD
  echo ""
fi
export PGPASSWORD

# ── Helper: run psql as superuser ────────────────────────────
SU() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" "$@"
}

# ── Helper: run psql as app user ─────────────────────────────
APP() {
  PGPASSWORD="$APP_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$APP_USER" -d "$DB_NAME" "$@"
}

# ── Step 1: create app user ──────────────────────────────────
echo "▶  Step 1: Ensuring app user '$APP_USER' exists…"
SU -tc "SELECT 1 FROM pg_roles WHERE rolname = '$APP_USER'" \
  | grep -q 1 \
  && echo "   User already exists — skipping." \
  || SU -c "CREATE USER $APP_USER WITH PASSWORD '$APP_PASS';"

# ── Step 2: create database ──────────────────────────────────
echo "▶  Step 2: Ensuring database '$DB_NAME' exists…"
SU -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" \
  | grep -q 1 \
  && echo "   Database already exists — skipping." \
  || SU -c "CREATE DATABASE $DB_NAME OWNER $APP_USER;"

# Grant privileges in case DB already existed under a different owner
SU -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $APP_USER;" 2>/dev/null || true
SU -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $APP_USER;" 2>/dev/null || true

# ── Step 3: schema ───────────────────────────────────────────
echo "▶  Step 3: Creating schema and tables…"
APP -f "$SCRIPT_DIR/init/001_schema.sql"

# ── Step 4: indexes ──────────────────────────────────────────
echo "▶  Step 4: Creating indexes…"
APP -f "$SCRIPT_DIR/init/002_indexes.sql"

# ── Step 5: seed data ────────────────────────────────────────
if [[ "$NO_SEED" != "--no-seed" ]]; then
  echo "▶  Step 5: Inserting seed data…"
  APP -f "$SCRIPT_DIR/seeds/001_seed_data.sql"
else
  echo "▶  Step 5: Skipping seed data (--no-seed flag set)"
fi

# ── Verify ───────────────────────────────────────────────────
echo ""
echo "▶  Tables in ev_renewable_db:"
APP -c "\dt public.*" 2>&1

echo ""
echo "▶  Row counts:"
APP -c "
SELECT
  relname  AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY relname;" 2>&1

echo ""
echo "✅  GreenCharge database is ready."
echo "    Connect with: psql -U $APP_USER -d $DB_NAME -h $DB_HOST"
echo ""

unset PGPASSWORD
