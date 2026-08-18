#!/usr/bin/env bash
#
# verify-phase4.sh - Smoke test for MUSE Phase 4 (Azure AI Foundry Voice
# integration: realtime voice sessions, speech-to-text/text-to-speech,
# device discovery/selection, mock voice provider).
#
# Usage:
#   npm run backend   # in one terminal
#   npm run dev       # in another terminal (optional, for frontend checks)
#   ./scripts/verify-phase4.sh
#
# Set MUSE_BACKEND_URL / MUSE_FRONTEND_URL to override defaults.

set -uo pipefail
cd "$(dirname "$0")/.."
source ./scripts/smoke-test-common.sh

echo "MUSE Phase 4 Smoke Test"
echo "Backend:  ${BASE_URL}"

require_backend

section "Voice devices (preserved Phase 2/3 contract)"
resp=$(check_ok "GET /api/voice/devices" GET "/api/voice/devices")
echo "$resp" | grep -q '"microphones"' && pass "devices payload has 'microphones' field" || fail "devices missing 'microphones': $resp"
echo "$resp" | grep -q '"speakers"' && pass "devices payload has 'speakers' field" || fail "devices missing 'speakers': $resp"

MIC_ID=$(echo "$resp" | tail -n1 | python3 -c "import sys,json; print(json.load(sys.stdin)['microphones'][0]['id'])" 2>/dev/null || echo "")
SPEAKER_ID=$(echo "$resp" | tail -n1 | python3 -c "import sys,json; print(json.load(sys.stdin)['speakers'][0]['id'])" 2>/dev/null || echo "")

section "Voice synthesis (preserved Phase 2/3 /synthesize contract)"
resp=$(check_ok "POST /api/voice/synthesize" POST "/api/voice/synthesize" '{"text":"Hello from Phase 4 smoke test."}')
echo "$resp" | grep -q '"status":"ok"' && pass "synthesize (legacy) succeeded" || fail "synthesize (legacy) failed: $resp"

section "Voice device selection"
if [ -n "$MIC_ID" ]; then
  resp=$(check_ok "POST /api/voice/devices/microphone" POST "/api/voice/devices/microphone" "{\"deviceId\":\"${MIC_ID}\"}")
  echo "$resp" | grep -q '"device"' && pass "microphone selected" || fail "microphone selection failed: $resp"
else
  fail "could not extract a microphone id to select"
fi

if [ -n "$SPEAKER_ID" ]; then
  resp=$(check_ok "POST /api/voice/devices/speaker" POST "/api/voice/devices/speaker" "{\"deviceId\":\"${SPEAKER_ID}\"}")
  echo "$resp" | grep -q '"device"' && pass "speaker selected" || fail "speaker selection failed: $resp"
else
  fail "could not extract a speaker id to select"
fi

section "Voice realtime session lifecycle (mock)"
resp=$(check_ok "POST /api/voice/start" POST "/api/voice/start" '{}')
echo "$resp" | grep -q '"session"' && pass "session started" || fail "start failed: $resp"
echo "$resp" | grep -q '"Listening"' && pass "session state is Listening after start" || fail "session state not Listening: $resp"

sleep 1

resp=$(check_ok "GET /api/voice/status" GET "/api/voice/status")
echo "$resp" | grep -q '"isMock":true' && pass "status reports mock voice provider" || fail "status did not report mock provider: $resp"
echo "$resp" | grep -q '"partialTranscript"' && pass "status includes partialTranscript field" || fail "status missing partialTranscript: $resp"
echo "$resp" | grep -q '"finalTranscript"' && pass "status includes finalTranscript field" || fail "status missing finalTranscript: $resp"

resp=$(check_ok "POST /api/voice/stop" POST "/api/voice/stop" '{}')
echo "$resp" | grep -q '"transcript"' && pass "session stopped with transcript" || fail "stop failed: $resp"

section "Voice speech synthesis (Phase 4 /speak)"
resp=$(check_ok "POST /api/voice/speak" POST "/api/voice/speak" '{"text":"This is a Phase 4 speech synthesis smoke test."}')
echo "$resp" | grep -q '"audioBase64"' && pass "speak returned synthesized audio payload" || fail "speak failed: $resp"

section "Voice session history"
resp=$(check_ok "GET /api/voice/sessions/history" GET "/api/voice/sessions/history")
echo "$resp" | grep -q '"sessions"' && pass "session history listed" || fail "session history failed: $resp"

section "Frontend Voice components (optional - skipped if dev server not running)"
if curl -s -o /dev/null "${FRONTEND_URL}/"; then
  for file in \
    "src/components/VoicePanel.tsx" \
    "src/components/MicrophoneSelector.tsx" \
    "src/components/SpeakerSelector.tsx" \
    "src/components/VoiceStatus.tsx" \
    "src/hooks/useVoice.ts" \
    "src/store/voiceStore.ts" \
    "src/services/voice/VoiceClient.ts"
  do
    code=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/${file}")
    [ "$code" = "200" ] && pass "${file} transforms via Vite" || fail "${file} failed to load ($code)"
  done
else
  echo "  (frontend not running at ${FRONTEND_URL} - start with 'npm run dev' to include these checks)"
fi

section "Services TypeScript compiles (Phase 4 voice layer)"
if npx tsc --noEmit -p ./services/tsconfig.json > /tmp/muse-services-tsc.log 2>&1; then
  pass "services/ TypeScript compiles with no errors"
else
  fail "services/ TypeScript compile failed - see /tmp/muse-services-tsc.log"
fi

section "Backend TypeScript compiles (Phase 4 voice routes/services)"
if npx tsc --noEmit -p ./backend/tsconfig.json > /tmp/muse-backend-tsc.log 2>&1; then
  pass "backend/ TypeScript compiles with no errors"
else
  fail "backend/ TypeScript compile failed - see /tmp/muse-backend-tsc.log"
fi

print_summary
