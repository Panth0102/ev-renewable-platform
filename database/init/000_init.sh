#!/bin/bash
# ============================================================
# GreenCharge — Docker initdb entry point
#
# Docker's entrypoint-initdb.d runs .sh and .sql files
# alphabetically. We use this shell script (prefixed 000_)
# so it runs first and can call psql -f on the SQL files using
# absolute paths — avoiding the \ir relative-path limitation
# that breaks when .sql files are run individually by initdb.
# ============================================================
set -e

DB_NAME="${POSTGRES_DB:-ev_renewable_db}"
DB_USER="${POSTGRES_USER:-ev_user}"
INIT_DIR="$(dirname "$0")"

echo "=== GreenCharge DB init: schema + indexes + seed ==="

psql -v ON_ERROR_STOP=1 --username "$DB_USER" --dbname "$DB_NAME" \
  -f "$INIT_DIR/001_schema.sql"

psql -v ON_ERROR_STOP=1 --username "$DB_USER" --dbname "$DB_NAME" \
  -f "$INIT_DIR/002_indexes.sql"

psql -v ON_ERROR_STOP=1 --username "$DB_USER" --dbname "$DB_NAME" \
  -f "$INIT_DIR/../db/seeds/001_seed_data.sql"

echo "=== GreenCharge DB ready ==="
