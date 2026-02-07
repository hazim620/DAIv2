#!/bin/bash
set -e
# Run schema and migration explicitly against the dev database (POSTGRES_DB).
# .raw files are mounted from host; only this script runs them.
# Extension needs superuser; in Docker the POSTGRES_USER is superuser.
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/bootstrap.raw
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/schema.raw
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/migration.raw
