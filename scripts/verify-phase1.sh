#!/usr/bin/env bash
#
# verify-phase1.sh — Smoke test for MUSE Phase 1 (React + Zustand + Framer
# Motion frontend, Express backend, dark-themed voice assistant shell).
#
# Usage:
#   npm run backend   # in one terminal
#   npm run dev       # in another terminal
#   ./scripts/verify-phase1.sh
#
# Set MUSE_BACKEND_URL / MUSE_FRONTEND_URL to override defaults.

set -uo pipefail
cd "$(dirname "$0")/.."
source ./scripts/smoke-test-common.sh

echo "MUSE Phase 1 Smoke Test"
echo "Backend:  ${BASE_URL}"
echo "Frontend: ${FRONTEND_URL}"

require_backend

section "Backend health"
resp=$(check_ok "GET /health returns healthy" GET "/health")
echo "$resp" | grep -q '"status":"healthy"' && pass "health payload correct" || fail "health payload unexpected: $resp"

section "Phase 1 placeholder contracts (preserved through Phase 2/3)"
resp=$(check_ok "POST /api/voice returns not_implemented" POST "/api/voice" '{}')
echo "$resp" | grep -q '"status":"not_implemented"' && pass "voice placeholder contract intact" || fail "voice placeholder contract changed: $resp"

resp=$(check_ok "POST /api/vault-search returns not_implemented" POST "/api/vault-search" '{"query":"test"}')
echo "$resp" | grep -q '"status":"not_implemented"' && pass "vault-search placeholder contract intact" || fail "vault-search placeholder contract changed: $resp"

section "Frontend dev server (optional — skipped if not running)"
if curl -s -o /dev/null "${FRONTEND_URL}/"; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/")
  [ "$code" = "200" ] && pass "frontend served at ${FRONTEND_URL} ($code)" || fail "frontend returned $code"

  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/components/Visualizer.tsx")
  [ "$code" = "200" ] && pass "Visualizer.tsx transforms via Vite" || fail "Visualizer.tsx failed to load ($code)"

  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/components/TranscriptPanel.tsx")
  [ "$code" = "200" ] && pass "TranscriptPanel.tsx transforms via Vite" || fail "TranscriptPanel.tsx failed to load ($code)"

  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/components/PushToTalkButton.tsx")
  [ "$code" = "200" ] && pass "PushToTalkButton.tsx transforms via Vite" || fail "PushToTalkButton.tsx failed to load ($code)"

  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/components/SettingsPanel.tsx")
  [ "$code" = "200" ] && pass "SettingsPanel.tsx transforms via Vite" || fail "SettingsPanel.tsx failed to load ($code)"

  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/store/museStore.ts")
  [ "$code" = "200" ] && pass "museStore.ts (Zustand) transforms via Vite" || fail "museStore.ts failed to load ($code)"
else
  echo "  (frontend not running at ${FRONTEND_URL} — start with 'npm run dev' to include these checks)"
fi

print_summary
