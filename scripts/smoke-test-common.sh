#!/usr/bin/env bash
#
# smoke-test-common.sh
#
# Shared helpers for the MUSE phase smoke-test scripts. Not meant to be run
# directly — sourced by verify-phase1.sh / verify-phase2.sh / verify-phase3.sh.

set -uo pipefail

BASE_URL="${MUSE_BACKEND_URL:-http://localhost:4000}"
FRONTEND_URL="${MUSE_FRONTEND_URL:-http://localhost:5173}"

PASS_COUNT=0
FAIL_COUNT=0

# Colors (disabled automatically when not a TTY)
if [ -t 1 ]; then
  C_GREEN="\033[0;32m"
  C_RED="\033[0;31m"
  C_YELLOW="\033[0;33m"
  C_RESET="\033[0m"
else
  C_GREEN=""; C_RED=""; C_YELLOW=""; C_RESET=""
fi

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo -e "  ${C_GREEN}✓${C_RESET} $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo -e "  ${C_RED}✗${C_RESET} $1"
}

section() {
  echo ""
  echo -e "${C_YELLOW}== $1 ==${C_RESET}"
}

# check_json_field <label> <method> <path> [json-body]
# Sends a request and asserts the HTTP status is 2xx and the body is valid JSON.
# Prints the response body compactly on failure for debugging.
check_ok() {
  local label="$1"; shift
  local method="$1"; shift
  local path="$1"; shift
  local body="${1:-}"

  local url="${BASE_URL}${path}"
  local response
  local http_code

  if [ -n "$body" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H 'Content-Type: application/json' -d "$body")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
  fi

  http_code=$(echo "$response" | tail -n1)
  local payload
  payload=$(echo "$response" | sed '$d')

  if [[ "$http_code" =~ ^2 ]]; then
    pass "$label ($http_code)"
    echo "$payload"
  else
    fail "$label (HTTP $http_code) — $path"
    echo "$payload" >&2
  fi
}

require_backend() {
  if ! curl -s -o /dev/null "${BASE_URL}/health"; then
    echo -e "${C_RED}Backend is not reachable at ${BASE_URL}.${C_RESET}"
    echo "Start it first with: npm run backend"
    exit 1
  fi
}

print_summary() {
  echo ""
  echo -e "${C_YELLOW}== Summary ==${C_RESET}"
  echo -e "  ${C_GREEN}Passed: ${PASS_COUNT}${C_RESET}"
  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "  ${C_RED}Failed: ${FAIL_COUNT}${C_RESET}"
    exit 1
  else
    echo -e "  ${C_RED}Failed: 0${C_RESET}"
  fi
}
