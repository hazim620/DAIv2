-- Run once per database as a superuser (e.g. postgres or cloud admin).
-- Migrator users (e.g. dai_migrator_preprod) cannot create extensions; run this before migrations.
-- Example: psql -h HOST -p PORT -U postgres -d dai_preprod -f database/bootstrap.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
