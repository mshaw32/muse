# Running MUSE

This guide covers everything needed to install, start, and stop MUSE in its
different modes: web dev mode (browser), full-stack dev mode (backend +
frontend), and the Electron desktop app.

## TL;DR — get MUSE running right now

This is the fastest path to a fully working desktop app with real voice
(real microphone in, real Azure-synthesized speech out).

```bash
# 1. One-time setup
npm install
az login                     # sign in to Azure (required for real voice)

# 2. Terminal 1 — backend + frontend, with real Azure AI Foundry Voice
VOICE_PROVIDER=foundry npm run dev:all

# 3. Terminal 2 — the desktop app
npm run electron
```

Then in the MUSE window:
1. Press the **Push-To-Talk** button (or the global hotkey
   `Ctrl+Shift+Space` / `Cmd+Shift+Space`) and speak into your microphone.
2. Release/press again to stop listening — your speech is transcribed by
   real Azure AI Foundry Speech-to-Text and appears in the transcript.
3. MUSE's spoken replies are synthesized by real Azure Text-to-Speech and
   played through your speakers automatically.

If you'd rather run without any Azure connectivity (no `az login` needed,
everything mocked), just drop `VOICE_PROVIDER=foundry`:

```bash
npm run dev:all       # terminal 1 — backend + frontend, mock voice
npm run electron      # terminal 2 — desktop app
```

You can confirm real voice is actually wired up and working with:

```bash
curl http://localhost:4000/api/voice/status        # check "provider": "foundry"
curl http://localhost:4000/api/voice/diagnostics    # all 4 checks should report "passed": true
```

See the sections below for other run modes (browser-only, backend-only),
how to stop MUSE, troubleshooting, and full details on the real-voice
provider switch.

## Prerequisites

- Node.js 18+ (developed/verified on Node v22)
- npm 10+
- macOS, Windows, or Linux (Electron desktop shell supports all three)
- (Only for real Azure AI Foundry Voice) [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
  installed and signed in via `az login`, with access to the
  `mbgsol-muse-dev-resource` Cognitive Services resource described in
  `docs/azure-resources.md`.

## 1. Install dependencies

Run this once (and again any time `package.json` files change) from the
**repo root** (`muse/`). This uses npm workspaces, so a single install covers
`shared`, `services`, `backend`, `frontend`, and `electron`:

```bash
npm install
```

If you are on a restricted/offline network and the Electron binary fails to
download, you can install everything else and skip it:

```bash
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install
```

You'll then need connectivity later to actually launch `npm run electron`.

## 2. Starting the application

### Option A — Frontend only (browser, UI work)

Starts the Vite dev server only. Useful for pure UI/styling work; API calls
will fail unless the backend is also running separately.

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

### Option B — Backend only

Builds `shared`/`services`, then starts the Express API with hot-reload.

```bash
npm run backend
```

The API listens on **http://localhost:4000**. Health check:

```bash
curl http://localhost:4000/health
```

### Option C — Full stack, web mode (recommended for most work)

Runs the backend and frontend together in one terminal (backend build/start,
then frontend dev server, both logged with colored prefixes):

```bash
npm run dev:all
```

- Frontend: http://localhost:5173 (proxies `/api/*` and `/health` to the backend)
- Backend: http://localhost:4000

### Option D — Desktop app (Electron)

Builds `shared`/`services`, builds the Electron main/preload bundle, and
launches the desktop shell:

```bash
npm run electron
```

Notes:
- The Electron app expects the frontend/backend dev servers to be reachable
  the same way as Option C — for full functionality, run `npm run dev:all`
  in one terminal first, then `npm run electron` in a second terminal.
- On first launch, MUSE registers a global hotkey
  (`Ctrl+Shift+Space` / `Cmd+Shift+Space`) to show/hide the window, and adds
  a system tray icon.

## 3. Stopping the application

### Web mode (Options A/B/C)

Press **Ctrl+C** in the terminal running the dev server(s). If you started
multiple terminals, press Ctrl+C in each one.

### Desktop app (Electron)

Any of the following will close MUSE:

- Use the **tray icon menu → Exit** (this is the reliable way to fully quit —
  closing the window normally just hides it to the tray).
- From the main window, use the app menu / `Cmd+Q` (macOS) or `Alt+F4`
  (Windows/Linux) if wired to quit, or simply select **Exit** from the tray.
- Press **Ctrl+C** in the terminal running `npm run electron` to force-kill
  the process if the tray isn't accessible.

If MUSE seems stuck in the tray with no visible window, click the tray icon
to reopen it, or use **Exit** from the tray menu to fully terminate the app
before restarting.

## 4. Verifying it works (smoke tests)

Once the backend (and optionally frontend) is running, you can confirm each
phase's contracts still hold with the bundled smoke-test scripts:

```bash
npm run verify:phase1   # Phase 1 — core voice UI + placeholder endpoints
npm run verify:phase2   # Phase 2 — Electron shell + service layer
npm run verify:phase3   # Phase 3 — Copilot chat/retrieval/streaming
npm run verify:phase4   # Phase 4 — Azure AI Foundry Voice integration (mock)
npm run verify:phase4.1 # Phase 4.1 — real Azure AI Foundry Voice (mock or real)
npm run verify:all      # all five, in order
```

Each script prints pass/fail per check and exits non-zero if anything
fails. Frontend-dependent checks are skipped automatically if
`npm run dev` isn't running. See `docs/PROJECT-STATUS.md` for what each
phase covers.

## 4a. Using real Azure AI Foundry Voice (Phase 4.1)

By default MUSE runs entirely on the Phase 4 mock voice provider — no
Azure connectivity or credentials are required. To use **real** Azure AI
Foundry Voice (real microphone transcription, real synthesized speech):

1. Sign in to Azure CLI once per machine/session: `az login`.
2. Start the backend with the Foundry provider enabled:
   ```bash
   VOICE_PROVIDER=foundry npm run backend
   ```
3. (Optional but recommended) confirm the pipeline is actually working
   against the real Azure resource:
   ```bash
   curl http://localhost:4000/api/voice/diagnostics
   ```
   All four checks (`testAuthentication`, `testConnectivity`,
   `testSpeechToText`, `testTextToSpeech`) should report `"passed": true`.
4. Launch the frontend/Electron app as usual (`npm run dev` and/or
   `npm run electron`) — Push-To-Talk now captures your real microphone
   and MUSE's replies are real synthesized speech played through your
   speakers.

No API keys, app registrations, client secrets, or service principals are
used — authentication is entirely via your signed-in Azure CLI identity
(`DefaultAzureCredential`/`AzureCliCredential`). Set `VOICE_PROVIDER=mock`
(or leave it unset) to go back to the mock provider at any time.

## 5. Common troubleshooting

| Symptom | Fix |
|---|---|
| `npm install` fails downloading Electron | Retry with `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install`, then run `npm install` again later on a network that allows it before using `npm run electron`. |
| Frontend loads but API calls fail | Make sure the backend is running (`npm run backend` or `npm run dev:all`) on port 4000. |
| Port 4000 or 5173 already in use | Stop any previously running MUSE dev servers (`Ctrl+C` in their terminals), or find and kill the process using the port. |
| Electron window won't reappear | Click the tray icon, or use tray menu → Exit and relaunch with `npm run electron`. |
| Changes to `shared/` or `services/` not reflected | Re-run `npm run build:libs` (done automatically by `npm run backend`, `npm run dev:all`, and `npm run electron`). |
| Real voice diagnostics fail with an auth/permission error | Run `az login` again (token may have expired), and confirm your account has access to the `mbgsol-muse-dev-resource` Cognitive Services resource (may require the "Cognitive Services Speech User" role). |
| Microphone doesn't work in the Electron app | Check OS-level microphone permission for the MUSE app (System Settings → Privacy → Microphone on macOS); Electron auto-grants the in-app permission prompt but the OS-level grant is separate. |

## 6. Quick reference

```bash
npm install                # install all workspace dependencies (once, or after dependency changes)
npm run dev                # frontend only (http://localhost:5173)
npm run backend            # backend only (http://localhost:4000), mock voice provider
VOICE_PROVIDER=foundry npm run backend  # backend with real Azure AI Foundry Voice (requires az login)
npm run dev:all            # backend + frontend together (recommended)
npm run electron           # desktop app (run alongside `npm run dev:all`)
npm run verify:all         # smoke-test all five phases
```

To stop: **Ctrl+C** in the terminal(s) for web mode, or **tray icon → Exit**
for the desktop app.
