#!/usr/bin/env bash
#
# verify-phase3.sh - Smoke test for MUSE Phase 3 (Microsoft 365 Copilot
# Enterprise Intelligence Layer: auth, chat, streaming, retrieval,
# conversation management, source attribution).
#
# Usage:
#   npm run backend   # in one terminal
#   npm run dev       # in another terminal (optional, for frontend checks)
#   ./scripts/verify-phase3.sh
#
# Set MUSE_BACKEND_URL / MUSE_FRONTEND_URL to override defaults.

set -uo pipefail
cd "$(dirname "$0")/.."
source ./scripts/smoke-test-common.sh

echo "MUSE Phase 3 Smoke Test"
echo "Backend:  ${BASE_URL}"

require_backend

section "Copilot authentication (mock)"
resp=$(check_ok "GET /api/copilot/status (initial)" GET "/api/copilot/status")
echo "$resp" | grep -q '"connected"' && pass "status payload has 'connected' field" || fail "status missing 'connected' field: $resp"

resp=$(check_ok "POST /api/copilot/auth/login" POST "/api/copilot/auth/login" '{}')
echo "$resp" | grep -q '"authenticated"' && pass "login authenticates (mock)" || fail "login did not authenticate: $resp"

resp=$(check_ok "GET /api/copilot/status (after login)" GET "/api/copilot/status")
echo "$resp" | grep -q '"connected":true' && pass "status reflects connected:true" || fail "status not connected after login: $resp"

section "Copilot Chat - grounded mock responses + sources"
resp=$(check_ok "POST /api/copilot/chat" POST "/api/copilot/chat" '{"prompt":"What is the status of Project Aurora?"}')
echo "$resp" | grep -q '"reply"' && pass "chat returns Phase 3 'reply' field" || fail "chat missing 'reply' field: $resp"
echo "$resp" | grep -q '"sources"' && pass "chat returns Phase 3 'sources' field" || fail "chat missing 'sources' field: $resp"
echo "$resp" | grep -q '"citations"' && pass "chat message includes citations" || fail "chat missing citations: $resp"

CONV_ID=$(echo "$resp" | tail -n1 | python3 -c "import sys,json; print(json.load(sys.stdin)['conversationId'])" 2>/dev/null || echo "")
if [ -n "$CONV_ID" ]; then
  pass "extracted conversationId ($CONV_ID) for follow-up calls"
else
  fail "could not extract conversationId from chat response"
fi

section "Copilot Retrieval - mock source attribution"
resp=$(check_ok "POST /api/copilot/retrieve (files)" POST "/api/copilot/retrieve" '{"type":"files","query":"budget"}')
echo "$resp" | grep -q '"results"' && pass "retrieve returns Phase 3 'results' array" || fail "retrieve missing 'results' field: $resp"

resp=$(check_ok "POST /api/copilot/retrieve (meetings)" POST "/api/copilot/retrieve" '{"type":"meetings","query":"sync"}')
echo "$resp" | grep -q '"results"' && pass "retrieve(meetings) returns results" || fail "retrieve(meetings) missing results: $resp"

resp=$(check_ok "POST /api/copilot/retrieve (work-context default)" POST "/api/copilot/retrieve" '{"query":"priorities"}')
echo "$resp" | grep -q '"work-context"' && pass "retrieve defaults to work-context type" || fail "retrieve did not default to work-context: $resp"

section "Conversation management"
resp=$(check_ok "POST /api/copilot/conversation/new" POST "/api/copilot/conversation/new" '{}')
NEW_CONV_ID=$(echo "$resp" | tail -n1 | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation']['id'])" 2>/dev/null || echo "")
[ -n "$NEW_CONV_ID" ] && pass "new conversation created ($NEW_CONV_ID)" || fail "failed to create new conversation: $resp"

resp=$(check_ok "GET /api/copilot/conversation/active" GET "/api/copilot/conversation/active")
echo "$resp" | grep -q '"conversation"' && pass "active conversation retrieved" || fail "active conversation failed: $resp"

resp=$(check_ok "GET /api/copilot/conversation/history" GET "/api/copilot/conversation/history")
echo "$resp" | grep -q '"conversations"' && pass "conversation history listed" || fail "conversation history failed: $resp"

if [ -n "$NEW_CONV_ID" ]; then
  # Put a message in the new conversation so export/summarize have content.
  check_ok "POST /api/copilot/chat (seed new conversation)" POST "/api/copilot/chat" "{\"prompt\":\"Smoke test message\",\"conversationId\":\"${NEW_CONV_ID}\"}" > /dev/null

  resp=$(check_ok "POST /api/copilot/conversation/summarize" POST "/api/copilot/conversation/summarize" "{\"conversationId\":\"${NEW_CONV_ID}\"}")
  echo "$resp" | grep -q '"summary"' && pass "conversation summarized" || fail "summarize failed: $resp"

  resp=$(check_ok "POST /api/copilot/conversation/export (markdown)" POST "/api/copilot/conversation/export" "{\"conversationId\":\"${NEW_CONV_ID}\",\"format\":\"markdown\"}")
  echo "$resp" | grep -q '"export"' && pass "conversation exported as markdown" || fail "export failed: $resp"

  resp=$(check_ok "POST /api/copilot/conversation/clear" POST "/api/copilot/conversation/clear" '{}')
  echo "$resp" | grep -q '"conversation"' && pass "conversation cleared" || fail "clear failed: $resp"
fi

section "Streaming responses (Server-Sent Events)"
STREAM_OUT=$(mktemp)
curl -s -N -X POST "${BASE_URL}/api/copilot/chat/stream" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Summarize my week"}' > "$STREAM_OUT"

if grep -q '"done":false' "$STREAM_OUT"; then
  pass "stream emitted incremental chunks (done:false)"
else
  fail "stream did not emit incremental chunks"
fi

if grep -q '"done":true' "$STREAM_OUT"; then
  pass "stream emitted final chunk (done:true) with complete message"
else
  fail "stream did not emit a final chunk"
fi

rm -f "$STREAM_OUT"

section "Frontend Copilot components (optional - skipped if dev server not running)"
if curl -s -o /dev/null "${FRONTEND_URL}/"; then
  for file in \
    "src/components/ChatInput.tsx" \
    "src/components/SourcePanel.tsx" \
    "src/components/CopilotStatus.tsx" \
    "src/components/CopilotPanel.tsx" \
    "src/hooks/useCopilot.ts" \
    "src/store/copilotStore.ts" \
    "src/services/copilot/CopilotClient.ts"
  do
    code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/${file}")
    [ "$code" = "200" ] && pass "${file} transforms via Vite" || fail "${file} failed to load ($code)"
  done
else
  echo "  (frontend not running at ${FRONTEND_URL} - start with 'npm run dev' to include these checks)"
fi

section "Backend TypeScript compiles (Phase 3 services)"
if npx tsc --noEmit -p ./backend/tsconfig.json > /tmp/muse-backend-tsc.log 2>&1; then
  pass "backend/ TypeScript compiles with no errors"
else
  fail "backend/ TypeScript compile failed - see /tmp/muse-backend-tsc.log"
fi

print_summary
