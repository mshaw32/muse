#!/usr/bin/env bash
# Double-click launcher for macOS Finder: starts the entire MUSE app
# (backend + frontend + Electron) with one click, no terminal needed.
cd "$(dirname "${BASH_SOURCE[0]}")"
./scripts/start-muse.sh
