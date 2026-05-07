#!/usr/bin/env bash
set -euo pipefail

npm run build

port="${PORT:-4174}"
npx http-server docs -p "$port" -c-1 >/tmp/coral-reef-pages.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$port/coral-reef-ecology-simulator/" >/dev/null; then
    break
  fi
  sleep 0.3
done

BASE_URL="http://127.0.0.1:$port/coral-reef-ecology-simulator/" npx playwright test tests/smoke.spec.ts

