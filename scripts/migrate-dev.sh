#!/bin/bash
set -a
source .env.dev
set +a

for f in migrations/*.sql; do
  echo "Running $f"
  docker compose -f docker-compose.dev.yml exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$f"
done