# MUSE Build Specification

## Project Goal

Build a Jarvis-style personal assistant called MUSE (Michael's Unified Strategy Engine).

The application must support:

- Push To Talk
- Real-time voice conversations
- Animated visualizer
- Transcript window
- Voice playback
- Future integration with Azure AI Foundry Voice Live
- Future integration with Copilot Studio
- Future integration with Microsoft 365

---

# Tech Stack

Frontend:
- React
- TypeScript
- Vite
- Framer Motion
- Zustand

Backend:
- Node.js
- Express
- TypeScript

---

# Visualizer States

The visualizer must support:

1. idle
2. listening
3. thinking
4. speaking
5. alert
6. error

State transitions must be managed through a central Zustand store.

---

# Front End Requirements

Create:

src/components/

Visualizer.tsx
TranscriptPanel.tsx
PushToTalkButton.tsx
SettingsPanel.tsx

Create:

src/store/

museStore.ts

Create:

src/types/

MuseState.ts

Define:

```ts
export type MuseState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "alert"
  | "error";
```

---

# Visualizer Requirements

Idle:

- slow blue pulse

Listening:

- active waveform
- blue glow

Thinking:

- orbit animation
- circular particles

Speaking:

- audio reactive bars

Alert:

- orange pulse

Error:

- red pulse

Use Framer Motion.

Animations must be independent from backend services.

Visualizer state must come from museStore.

---

# Transcript Window

Create:

TranscriptPanel.tsx

Requirements:

- scrollable
- user messages
- assistant messages
- timestamps

Store messages in Zustand.


---

# Push To Talk Button

Create:

PushToTalkButton.tsx

Requirements:

- press to begin listening
- release to stop listening
- update store state
- no speech SDK implementation yet

This is a UI-only version.

---

# Global Store

Create:

museStore.ts

Store:

- current MuseState
- transcript list
- settings
- session id

Create actions:

setState()
addMessage()
clearMessages()

---

# Backend Requirements

Create:

/health

Returns:

{
  "status":"healthy"
}

Create:

/api/voice

Placeholder endpoint

Returns:

{
  "status":"not_implemented"
}

Create:

/api/vault-search

Placeholder endpoint

Returns:

{
  "status":"not_implemented"
}

Use Express.

Use TypeScript.

---

# Styling

Theme:

Dark

Colors:

Background:
#050816

Primary:
#0078D4

Thinking:
#7A5AF8

Alert:
#FFA62B

Error:
#EF4444

Use modern glassmorphism cards.

---

# Important

Generate working code.

Create all folders.

Create all imports.

Create all TypeScript interfaces.

Create all React components.

Create no placeholders beyond backend APIs.

Application must run immediately after npm install and npm run dev.