#!/bin/bash
# GreenCharge — Docker initdb bootstrap
# All files are mounted flat at /docker-entrypoint-initdb.d/
set -e

DB_NAME="${POSTGRES_DB:-ev_renewable_db}"
DB_USER="${POSTGRES_USER:-ev_user}"
DIR="/docker-entrypoint-initdb.d"

echo "=== GreenCharge: schema ==="
psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -f "$DIR/001_schema.sql"

echo "=== GreenCharge: indexes ==="
psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -f "$DIR/002_indexes.sql"

echo "=== GreenCharge: seed data ==="
psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -f "$DIR/003_seed_data.sql"

echo "=== GreenCharge: database ready ==="
