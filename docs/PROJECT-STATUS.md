# MUSE — Project Status & Architecture

_Last updated: 2026-08-17 (Phase 4)_

This document summarizes the current state of MUSE: what's built, how it's
architected, and what's still to come. See also `RUNNING-THE-APP.md` for
day-to-day run/stop instructions and the `PHASE-*-BUILD-SPEC.md` files for
the original specs each phase was built against.

## What MUSE is

> **MUSE = Voice + Memory + Personality + Actions**
> **Microsoft 365 Copilot = Enterprise Intelligence Layer**
> **Azure AI Foundry = Voice Layer**

MUSE is a Jarvis-style personal AI operating system: a voice-first desktop
assistant with a persistent local memory vault, a pluggable action framework
for taking real-world actions (with human-approval gating), and an
enterprise intelligence layer backed by Microsoft 365 Copilot (chat,
retrieval, conversations) — all wrapped in an Electron desktop shell with
system tray and global hotkeys.

## High-level architecture

```
┌───────────────────────────────────────────────────────────────────┐
│ Electron Shell (electron/)                                        │
│  main.ts · preload.ts · windowManager.ts · tray.ts · hotkeys.ts   │
│  - System tray, global hotkey show/hide, single-instance lock      │
└───────────────────────────────────────────────────────────────────┘
              │ loads
              ▼
┌───────────────────────────────────────────────────────────────────┐
│ Frontend (frontend/) — React + TypeScript + Vite                  │
│  components/  (Visualizer, TranscriptPanel, PushToTalkButton,      │
│                SettingsPanel, layout/{Sidebar,ContextPanel,        │
│                StatusBar}, ChatInput, SourcePanel, CopilotStatus,  │
│                CopilotPanel, VoicePanel, MicrophoneSelector,       │
│                SpeakerSelector, VoiceStatus)                        │
│  store/       Zustand: museStore.ts, copilotStore.ts, voiceStore.ts │
│  hooks/       useElectronBridge.ts, useCopilot.ts, useVoice.ts      │
│  services/copilot/CopilotClient.ts  (fetch + SSE streaming client) │
│  services/voice/VoiceClient.ts      (fetch client for /api/voice/*) │
│  Framer Motion drives all visualizer state animations               │
└───────────────────────────────────────────────────────────────────┘
              │ HTTP/SSE (localhost:4000, proxied via Vite in dev)
              ▼
┌───────────────────────────────────────────────────────────────────┐
│ Backend (backend/) — Express + TypeScript (ts-node-dev)           │
│  routes/  health.ts, session.ts, memory.ts, voice.ts,               │
│           vaultSearch.ts (Phase 1 placeholder), actions.ts,        │
│           copilot.ts (auth, chat, chat/stream, retrieve,           │
│                       conversation/*)                               │
│  services/copilot/  wraps services/src/copilot for HTTP use         │
│  services/voice/    wraps services/src/voice for HTTP use           │
│                      (AzureVoiceService, VoiceSessionManager)       │
└───────────────────────────────────────────────────────────────────┘
              │ imports (npm workspaces)
              ▼
┌───────────────────────────────────────────────────────────────────┐
│ services/ (shared service layer, framework-agnostic)               │
│  copilot/       CopilotAuthService, CopilotChatService,            │
│                 CopilotRetrievalService, CopilotConversationService │
│                 (all mock implementations — see "Mocked" below)    │
│  memory/        Local Memory Vault (store/search)                  │
│  actions/       Action Framework + plugins/ (human-approval gate)   │
│  voice/         Azure AI Foundry Voice abstraction layer:           │
│                 VoiceService (facade), VoiceConfiguration (env/     │
│                 azure-resources.md config), VoiceSessionService,    │
│                 SpeechToTextService, TextToSpeechService,           │
│                 AudioDeviceService, MockVoiceProvider, VoiceLogger   │
│                 (mock-backed pending real Azure AI Foundry Voice)   │
│  conversation/  Conversation lifecycle used by copilot/             │
└───────────────────────────────────────────────────────────────────┘
              │ imports
              ▼
┌───────────────────────────────────────────────────────────────────┐
│ shared/ — cross-cutting types, logging, settings                   │
│  types/    shared TypeScript interfaces (Session, Message, etc.)    │
│  logging/  shared logger                                            │
│  settings/ shared app settings/config types                        │
└───────────────────────────────────────────────────────────────────┘
```

npm workspaces tie these five packages together (`shared`, `services`,
`backend`, `frontend`, `electron`) from the root `package.json`.

## What's built

### Phase 1 — Core voice UI (browser-only)
- React + Vite + TypeScript frontend shell.
- Zustand store (`museStore.ts`) for voice/transcript/visualizer state.
- Framer Motion-driven `Visualizer` with idle/listening/thinking/speaking
  states, `TranscriptPanel`, `PushToTalkButton`, `SettingsPanel`.
- Dark-themed UI throughout.
- Backend placeholders: `/health`, `/api/voice`, `/api/vault-search`
  (both intentionally `not_implemented` at this phase).

### Phase 2 — Electron + service layer
- Electron main process, preload script, system tray, global hotkey
  (`Cmd/Ctrl+Shift+Space`), window show/hide/quit management.
- Service abstractions (all under `services/src/`):
  - Microsoft 365 Copilot Chat API (mock, superseded/extended in Phase 3)
  - Microsoft 365 Copilot Retrieval API (mock, superseded/extended in Phase 3)
  - Azure AI Foundry Voice (mock TTS + device listing)
  - Local Memory Vault (store/search, file-backed)
  - Action Framework with a human-approval gate (`awaiting_approval` →
    resubmit with `approvedByUser: true`) and mock plugins
    (`outlook.draft-email`, `outlook.send-email`, etc.)
- New frontend layout components: `Sidebar`, `ContextPanel`, `StatusBar`,
  plus `useElectronBridge.ts` hook for renderer↔main IPC.
- Explicitly **not** implemented in Phase 2: Microsoft Graph crawlers.

### Phase 3 — Copilot integration (Enterprise Intelligence Layer)
- Full service layer: `CopilotAuthService` (mock login/logout/status),
  `CopilotChatService`, `CopilotRetrievalService`,
  `CopilotConversationService` (new/active/history/summarize/export/clear).
- Backend routes (`backend/src/routes/copilot.ts`): `/api/copilot/status`,
  `/auth/login`, `/auth/logout`, `/chat`, `/chat/stream` (SSE streaming),
  `/retrieve`, `/conversation/{new,active,history,summarize,export,clear}`.
- Frontend: `ChatInput`, `SourcePanel`, `CopilotStatus`, `CopilotPanel`
  components; `copilotStore.ts` (Zustand); `useCopilot.ts` hook;
  `CopilotClient.ts` service (fetch + SSE consumer).
- Realistic mock chat replies with inline citation markers (`[1] [2]`),
  mock source attribution (`sources[]` with type/title/snippet/url),
  and mock retrieval across `files`, `meetings`, `projects`,
  `work-context` result types.
- Explicitly **not** implemented in Phase 3 (per spec): Microsoft Graph,
  Outlook integration, SharePoint integration, Planner integration, real
  Azure AI Foundry Voice.

### Cross-cutting: smoke tests & tooling
- `scripts/smoke-test-common.sh` — shared bash assertion helpers used by
  all phase scripts.
- `scripts/verify-phase1.sh`, `scripts/verify-phase2.sh`,
  `scripts/verify-phase3.sh`, `scripts/verify-phase4.sh` — black-box smoke
  tests hitting the live backend (and optionally the live frontend dev
  server) to confirm each phase's contracts still hold. Wired up as
  `npm run verify:phase1`, `verify:phase2`, `verify:phase3`,
  `verify:phase4`, and `verify:all`.

### Phase 4 — Azure AI Foundry Voice integration
- `VoiceConfiguration` — loads Azure AI Foundry Voice project/resource
  identifiers from environment variables, falling back to the documented
  values in `docs/azure-resources.md` (no hardcoded secrets/resources);
  resolves mock-vs-real provider selection.
- `VoiceSessionService` — realtime voice session lifecycle (start / stop /
  pause / resume) using the spec's 6-state model: Idle, Listening,
  Processing, Speaking, Disconnected, Error.
- `SpeechToTextService` — start/stop listening with partial/final
  transcript and error event callbacks.
- `TextToSpeechService` — generate/stream/cancel speech synthesis, volume
  control, voice selection.
- `AudioDeviceService` — microphone/speaker listing, default-device
  lookup, selection, and persistence.
- `MockVoiceProvider` — bundles all of the above mock engines so the full
  voice stack is testable without any Azure connectivity.
- `VoiceLogger` — structured logging for session/transcript/speech/device/
  error events (mirrors `CopilotLogger`'s convention).
- Backend: `AzureVoiceService` + `VoiceSessionManager`
  (`backend/src/services/voice/`) plus new routes in
  `backend/src/routes/voice.ts`: `POST /api/voice/start`, `/stop`,
  `/speak`, `GET /status`, `POST /devices/microphone`, `/devices/speaker`,
  `GET /sessions/history` — all added alongside the untouched Phase 1/2/3
  `POST /api/voice`, `/synthesize`, `GET /devices` contracts.
- Frontend: `VoicePanel`, `MicrophoneSelector`, `SpeakerSelector`,
  `VoiceStatus` components; `voiceStore.ts` (Zustand); `useVoice.ts` hook
  bridging voice state onto the existing Visualizer (`museStore.museState`)
  and Transcript Panel (`museStore.addMessage`) without modifying either;
  `VoiceClient.ts` service.
- `PushToTalkButton` rewired to drive the real (mock-backed) voice session
  flow instead of the earlier `setTimeout` simulation; the existing global
  Electron hotkey now also triggers `voiceStore.startListening()`.
- New settings: Voice Enabled, Auto Start Listening, Push-To-Talk Enabled
  (added to `SettingsPanel` and `VoiceSettingsConfig`).
- Explicitly **not** implemented in Phase 4 (per spec): Outlook actions,
  Planner actions, Teams actions, and any change to the Copilot
  abstraction layer.

## What's mocked (by explicit design, not a gap)

These are intentionally mocked per the Phase 2/3/4 build specs, pending real
credentials/API access:
- Microsoft 365 Copilot Chat/Retrieval APIs (real Copilot API access not
  yet available — mock returns realistic, structurally-correct payloads).
- Azure AI Foundry Voice (mock STT/TTS + device list via
  `MockVoiceProvider`; `VoiceConfiguration.isMockProvider()` returns `true`
  until real Azure AI Foundry Voice credentials are configured via
  environment variables).
- Copilot auth (mock login/logout/status; no real MSAL/OAuth flow yet).

## What's still to be built

- Real Microsoft 365 Copilot Chat/Retrieval API integration (replacing the
  mock service implementations with actual authenticated calls).
- Real Azure AI Foundry Voice Live SDK integration (Phase 5, per the Phase
  4 spec), replacing `MockVoiceProvider` with real STT/TTS/session
  streaming once Azure credentials are available.
- Copilot + Voice end-to-end conversation loop (Phase 6, per the Phase 4
  spec).
- Real authentication (MSAL / Entra ID) for Copilot access, replacing the
  mock auth service.
- Microsoft Graph-based crawlers (explicitly out of scope through
  Phase 4; first candidate for a future phase).
- Outlook, SharePoint, Planner, and Teams integrations (explicitly out of
  scope through Phase 4).
- Expanded Action Framework plugins beyond the current mock set.
- Packaging/distribution for the Electron app (installers, auto-update).

## Verifying the current build

```bash
npm install
npm run backend     # terminal 1
npm run dev          # terminal 2 (optional, enables frontend checks below)
npm run verify:all   # runs phase 1 + 2 + 3 + 4 smoke tests
```

See `RUNNING-THE-APP.md` for full run/stop instructions and troubleshooting.
