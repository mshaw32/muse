#!/usr/bin/env bash
#
# verify-phase2.sh — Smoke test for MUSE Phase 2 (Electron shell + service
# abstractions: Memory Vault, Copilot Chat/Retrieval, Azure AI Foundry
# Voice, Action Framework).
#
# Usage:
#   npm run backend   # in one terminal
#   npm run dev       # in another terminal (optional, for frontend checks)
#   ./scripts/verify-phase2.sh
#
# Set MUSE_BACKEND_URL / MUSE_FRONTEND_URL to override defaults.

set -uo pipefail
cd "$(dirname "$0")/.."
source ./scripts/smoke-test-common.sh

echo "MUSE Phase 2 Smoke Test"
echo "Backend:  ${BASE_URL}"

require_backend

section "Session lifecycle"
resp=$(check_ok "POST /api/session/start" POST "/api/session/start" '{"title":"Phase 2 Smoke Test"}')
echo "$resp" | grep -q '"status":"ok"' && pass "session started" || fail "session start failed: $resp"

check_ok "POST /api/session/end" POST "/api/session/end" '{}' > /dev/null

section "Memory Vault service"
resp=$(check_ok "POST /api/memory/store" POST "/api/memory/store" '{"category":"decisions","title":"Smoke Test Entry","content":"Created by verify-phase2.sh","tags":["smoke-test"]}')
echo "$resp" | grep -q '"status":"ok"' && pass "memory entry stored" || fail "memory store failed: $resp"

resp=$(check_ok "POST /api/memory/search" POST "/api/memory/search" '{"query":"Smoke Test Entry"}')
echo "$resp" | grep -q '"status":"ok"' && pass "memory search returned" || fail "memory search failed: $resp"

section "Microsoft 365 Copilot service (Phase 2 contract)"
resp=$(check_ok "POST /api/copilot/chat (Phase 2 fields)" POST "/api/copilot/chat" '{"question":"What are my current priorities?"}')
echo "$resp" | grep -q '"answer"' && pass "chat returns Phase 2 'answer' field" || fail "chat missing 'answer' field: $resp"
echo "$resp" | grep -q '"citations"' && pass "chat returns Phase 2 'citations' field" || fail "chat missing 'citations' field: $resp"

resp=$(check_ok "POST /api/copilot/retrieve (projects)" POST "/api/copilot/retrieve" '{"type":"projects"}')
echo "$resp" | grep -q '"projects"' && pass "retrieve returns Phase 2 'projects' field" || fail "retrieve missing 'projects' field: $resp"

section "Action Framework (human-approval gate)"
resp=$(check_ok "GET /api/actions (catalog)" GET "/api/actions")
echo "$resp" | grep -q '"actions"' && pass "action catalog listed" || fail "action catalog failed: $resp"

resp=$(check_ok "POST /api/actions/execute — draft-email (no approval required)" POST "/api/actions/execute" '{"actionId":"outlook.draft-email","parameters":{"to":"test@example.com","subject":"hi","body":"hi"}}')
echo "$resp" | grep -q '"completed"' && pass "no-approval action completed" || fail "expected 'completed' status: $resp"

resp=$(check_ok "POST /api/actions/execute — send-email (requires approval)" POST "/api/actions/execute" '{"actionId":"outlook.send-email","parameters":{"to":"test@example.com","subject":"hi","body":"hi"}}')
echo "$resp" | grep -q '"awaiting_approval"' && pass "approval-gated action returns awaiting_approval" || fail "expected 'awaiting_approval' status: $resp"

resp=$(check_ok "POST /api/actions/execute — send-email (approved)" POST "/api/actions/execute" '{"actionId":"outlook.send-email","parameters":{"to":"test@example.com","subject":"hi","body":"hi"},"approvedByUser":true}')
echo "$resp" | grep -q '"completed"' && pass "approved action completes" || fail "expected 'completed' after approval: $resp"

section "Azure AI Foundry Voice service (mock)"
resp=$(check_ok "GET /api/voice/devices" GET "/api/voice/devices")
echo "$resp" | grep -q '"microphones"' && pass "voice devices listed" || fail "voice devices failed: $resp"

resp=$(check_ok "POST /api/voice/synthesize" POST "/api/voice/synthesize" '{"text":"Hello from MUSE"}')
echo "$resp" | grep -q '"status":"ok"' && pass "voice synthesis (mock) succeeded" || fail "voice synthesis failed: $resp"

section "Frontend Electron-bridge modules (optional — skipped if dev server not running)"
if curl -s -o /dev/null "${FRONTEND_URL}/"; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/components/layout/Sidebar.tsx")
  [ "$code" = "200" ] && pass "Sidebar.tsx transforms via Vite" || fail "Sidebar.tsx failed to load ($code)"

  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/components/layout/ContextPanel.tsx")
  [ "$code" = "200" ] && pass "ContextPanel.tsx transforms via Vite" || fail "ContextPanel.tsx failed to load ($code)"

  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/components/layout/StatusBar.tsx")
  [ "$code" = "200" ] && pass "StatusBar.tsx transforms via Vite" || fail "StatusBar.tsx failed to load ($code)"

  code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/src/hooks/useElectronBridge.ts")
  [ "$code" = "200" ] && pass "useElectronBridge.ts transforms via Vite" || fail "useElectronBridge.ts failed to load ($code)"
else
  echo "  (frontend not running at ${FRONTEND_URL} — start with 'npm run dev' to include these checks)"
fi

section "Electron shell TypeScript compiles"
if npx tsc --noEmit -p ./electron/tsconfig.json > /tmp/muse-electron-tsc.log 2>&1; then
  pass "electron/ TypeScript compiles with no errors"
else
  fail "electron/ TypeScript compile failed — see /tmp/muse-electron-tsc.log"
fi

print_summary
