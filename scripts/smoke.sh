#!/usr/bin/env bash
set -euo pipefail

npm run build

port="${PORT:-$((4100 + RANDOM % 1000))}"
node scripts/serve-pages.mjs "$port" >/tmp/coral-reef-pages.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT

ready=0
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$port/coral-reef-ecology-simulator/" >/dev/null; then
    ready=1
    break
  fi
  sleep 0.3
done

if [ "$ready" != "1" ]; then
  cat /tmp/coral-reef-pages.log >&2 || true
  exit 1
fi

BASE_URL="http://127.0.0.1:$port/coral-reef-ecology-simulator/" npx playwright test tests/smoke.spec.ts
