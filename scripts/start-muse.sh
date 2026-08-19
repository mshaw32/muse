#!/usr/bin/env bash
#
# start-muse.sh — single entry point to launch the entire MUSE app.
#
# Starts, in order:
#   1. Kills any stale backend/frontend processes left over from a
#      previous run (so you never accidentally talk to an old server).
#   2. Builds @muse/shared + @muse/services (libs the backend depends on).
#   3. Starts the backend API (VOICE_PROVIDER=foundry by default) in the
#      background and waits until it responds on http://localhost:4000.
#   4. Starts the Vite frontend dev server in the background and waits
#      until it responds on http://localhost:5173.
#   5. Launches the Electron desktop app in the foreground, pointed at
#      the running frontend/backend.
#
# When you close the Electron window (or Ctrl+C this script), the
# backend and frontend background processes are automatically stopped.
#
# Usage:
#   ./scripts/start-muse.sh                 # real Azure AI Foundry voice
#   VOICE_PROVIDER=mock ./scripts/start-muse.sh   # mock voice (no az login needed)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VOICE_PROVIDER="${VOICE_PROVIDER:-foundry}"
export VOICE_PROVIDER

BACKEND_PORT=4000
FRONTEND_PORT=5173
LOG_DIR="$ROOT_DIR/.muse-logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_PID=""
FRONTEND_PID=""

log() {
  echo "[start-muse] $*"
}

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti "tcp:$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    log "Stopping existing process(es) on port $port: $pids"
    kill $pids 2>/dev/null || true
    sleep 1
    # Force-kill anything still alive.
    pids="$(lsof -ti "tcp:$port" 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

cleanup() {
  log "Shutting down..."
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  # Also clean up anything still bound to the ports, in case child
  # processes (ts-node-dev/vite) spawned their own subprocesses.
  kill_port "$BACKEND_PORT"
  kill_port "$FRONTEND_PORT"
  log "Stopped."
}
trap cleanup EXIT INT TERM

wait_for_http() {
  local url="$1"
  local name="$2"
  local attempts=60
  log "Waiting for $name ($url)..."
  for ((i = 1; i <= attempts; i++)); do
    if curl -sf "$url" >/dev/null 2>&1; then
      log "$name is up."
      return 0
    fi
    sleep 1
  done
  log "ERROR: $name did not start within ${attempts}s. Check $LOG_DIR for logs."
  exit 1
}

log "Voice provider: $VOICE_PROVIDER"

kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"

log "Building shared libraries (@muse/shared, @muse/services)..."
npm run build:libs

log "Starting backend on port $BACKEND_PORT..."
(npm run dev --workspace=backend >"$BACKEND_LOG" 2>&1) &
BACKEND_PID=$!
wait_for_http "http://localhost:$BACKEND_PORT/api/voice/status" "backend"

log "Starting frontend on port $FRONTEND_PORT..."
(npm run dev --workspace=frontend >"$FRONTEND_LOG" 2>&1) &
FRONTEND_PID=$!
wait_for_http "http://localhost:$FRONTEND_PORT" "frontend"

log "Building and launching Electron app..."
npm run build --workspace=electron
npm run start --workspace=electron

# When Electron exits (window closed / quit), the trap above stops
# the backend and frontend automatically.
