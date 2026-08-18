#!/usr/bin/env bash
#
# verify-phase4.1.sh - Smoke test for MUSE Phase 4.1 (real Azure AI Foundry
# Voice: provider switching, Entra ID authentication, live diagnostics,
# and the /api/voice/audio real-mic-feed route).
#
# Works against either voice provider:
#   - VOICE_PROVIDER unset/mock: backend runs the Phase 4 mock engines;
#     this script confirms Phase 4.1 fields (provider/connectionState/
#     authenticationMode) are present with mock values and that
#     diagnostics/audio routes exist and respond without crashing.
#   - VOICE_PROVIDER=foundry: backend authenticates against Azure via
#     DefaultAzureCredential/AzureCliCredential (requires `az login`) and
#     this script asserts all four diagnostics checks actually pass
#     against the real Azure AI Foundry Speech resource.
#
# Usage:
#   npm run backend                       # mock provider
#   VOICE_PROVIDER=foundry npm run backend  # real Azure provider (az login required)
#   ./scripts/verify-phase4.1.sh
#
# Set MUSE_BACKEND_URL to override the default http://localhost:4000.

set -uo pipefail
cd "$(dirname "$0")/.."
source ./scripts/smoke-test-common.sh

echo "MUSE Phase 4.1 Smoke Test (Real Azure AI Foundry Voice)"
echo "Backend:  ${BASE_URL}"

require_backend

section "Voice status (Phase 4.1 provider/connection/auth fields)"
resp=$(check_ok "GET /api/voice/status" GET "/api/voice/status")
echo "$resp" | grep -q '"provider"' && pass "status includes 'provider' field" || fail "status missing 'provider': $resp"
echo "$resp" | grep -q '"connectionState"' && pass "status includes 'connectionState' field" || fail "status missing 'connectionState': $resp"
echo "$resp" | grep -q '"authenticationMode"' && pass "status includes 'authenticationMode' field" || fail "status missing 'authenticationMode': $resp"

PROVIDER=$(echo "$resp" | tail -n1 | python3 -c "import sys,json; print(json.load(sys.stdin).get('provider','mock'))" 2>/dev/null || echo "mock")
echo "  (detected provider: ${PROVIDER})"

section "Voice diagnostics (testAuthentication/testConnectivity/testSpeechToText/testTextToSpeech)"
resp=$(check_ok "GET /api/voice/diagnostics" GET "/api/voice/diagnostics")
echo "$resp" | grep -q '"testAuthentication"' && pass "diagnostics ran testAuthentication" || fail "diagnostics missing testAuthentication: $resp"
echo "$resp" | grep -q '"testConnectivity"' && pass "diagnostics ran testConnectivity" || fail "diagnostics missing testConnectivity: $resp"
echo "$resp" | grep -q '"testSpeechToText"' && pass "diagnostics ran testSpeechToText" || fail "diagnostics missing testSpeechToText: $resp"
echo "$resp" | grep -q '"testTextToSpeech"' && pass "diagnostics ran testTextToSpeech" || fail "diagnostics missing testTextToSpeech: $resp"

if [ "$PROVIDER" = "foundry" ]; then
  echo "$resp" | grep -q '"status":"ok"' && pass "all diagnostics passed against real Azure AI Foundry" || fail "one or more diagnostics failed against real Azure: $resp"
else
  echo "  (provider is mock - skipping strict pass/fail assertion on diagnostics; endpoint reachability already confirmed above)"
fi

section "Voice realtime session lifecycle (provider-agnostic)"
resp=$(check_ok "POST /api/voice/start" POST "/api/voice/start" '{}')
echo "$resp" | grep -q '"session"' && pass "session started" || fail "start failed: $resp"

sleep 1

section "Voice audio feed (Phase 4.1 real mic PCM ingestion route)"
# Small silent 16-bit PCM chunk, base64-encoded, exercises the route without
# requiring a real microphone in this non-interactive smoke test.
SILENT_PCM_B64="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
resp=$(check_ok "POST /api/voice/audio" POST "/api/voice/audio" "{\"audioBase64\":\"${SILENT_PCM_B64}\"}")
echo "$resp" | grep -q '"status":"ok"' && pass "audio feed accepted" || fail "audio feed failed: $resp"

resp=$(check_ok "POST /api/voice/stop" POST "/api/voice/stop" '{}')
echo "$resp" | grep -q '"transcript"' && pass "session stopped with transcript" || fail "stop failed: $resp"

section "Frontend Phase 4.1 real-audio components (optional - skipped if dev server not running)"
if curl -s -o /dev/null "${FRONTEND_URL}/"; then
  for file in \
    "src/services/voice/MicrophoneCapture.ts" \
    "src/services/voice/AudioPlayback.ts" \
    "src/components/VoiceStatus.tsx" \
    "src/store/voiceStore.ts"
  do
    code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/${file}")
    [ "$code" = "200" ] && pass "${file} transforms via Vite" || fail "${file} failed to load ($code)"
  done
else
  echo "  (frontend not running at ${FRONTEND_URL} - start with 'npm run dev' to include these checks)"
fi

section "Services TypeScript compiles (Phase 4.1 foundry voice layer)"
if npx tsc --noEmit -p ./services/tsconfig.json > /tmp/muse-services-tsc.log 2>&1; then
  pass "services/ TypeScript compiles with no errors"
else
  fail "services/ TypeScript compile failed - see /tmp/muse-services-tsc.log"
fi

section "Backend TypeScript compiles (Phase 4.1 voice routes/services)"
if npx tsc --noEmit -p ./backend/tsconfig.json > /tmp/muse-backend-tsc.log 2>&1; then
  pass "backend/ TypeScript compiles with no errors"
else
  fail "backend/ TypeScript compile failed - see /tmp/muse-backend-tsc.log"
fi

section "Electron TypeScript compiles (getUserMedia permission handler)"
if npx tsc --noEmit -p ./electron/tsconfig.json > /tmp/muse-electron-tsc.log 2>&1; then
  pass "electron/ TypeScript compiles with no errors"
else
  fail "electron/ TypeScript compile failed - see /tmp/muse-electron-tsc.log"
fi

print_summary
