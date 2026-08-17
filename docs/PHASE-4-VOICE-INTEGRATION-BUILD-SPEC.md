# PHASE 4 BUILD SPECIFICATION

## Project Name

MUSE (Michael's Unified Strategy Engine)

---

# Objective

Integrate Azure AI Foundry Voice into MUSE.

Phase 4 introduces real voice capabilities.

This phase focuses exclusively on:

- Speech-To-Text
- Text-To-Speech
- Realtime Voice Sessions
- Microphone Input
- Speaker Output
- Voice Conversation Loop
- Push-To-Talk Integration

Do not implement Planner.

Do not implement Outlook Actions.

Do not implement Teams Actions.

Do not implement Microsoft 365 Copilot API authentication.

Do not modify the Copilot abstraction layer created in Phase 3.

---

# Existing Azure Resources

The implementation must use configuration values loaded from:

docs/azure-resources.md

Resource information will be treated as the source of truth.

Do not hardcode resource values.

Create a configuration provider.

---

# Architecture

Electron

↓

React UI

↓

Voice Layer

↓

Azure AI Foundry Voice

↓

Copilot Layer (Future)

---

# Repository Structure

services/

voice/

VoiceService.ts

VoiceSessionService.ts

SpeechToTextService.ts

TextToSpeechService.ts

AudioDeviceService.ts

VoiceConfiguration.ts

VoiceModels.ts

backend/

src/

services/

voice/

AzureVoiceService.ts

VoiceSessionManager.ts

frontend/

src/

components/

VoicePanel.tsx

MicrophoneSelector.tsx

SpeakerSelector.tsx

VoiceStatus.tsx

hooks/

useVoice.ts

---

# Voice Configuration

Create:

VoiceConfiguration.ts

Load configuration from:

Environment Variables

and

azure-resources.md references

No hard-coded values.

---

# Voice Session Service

Create:

VoiceSessionService.ts

Responsibilities:

- Start Session
- Stop Session
- Pause Session
- Resume Session
- Session State Tracking

States:

Idle

Listening

Processing

Speaking

Disconnected

Error

---

# Speech To Text Service

Create:

SpeechToTextService.ts

Support:

Start Listening

Stop Listening

Partial Transcript Events

Final Transcript Events

Error Events

---

# Text To Speech Service

Create:

TextToSpeechService.ts

Support:

Generate Speech

Stream Speech

Cancel Speech

Volume Control

Voice Selection

---

# Audio Device Service

Create:

AudioDeviceService.ts

Support:

List Microphones

List Speakers

Get Default Devices

Change Devices

Persist Device Selection

---

# Voice Models

Create:

VoiceModels.ts

Define:

VoiceSession

VoiceTranscript

VoiceDevice

VoiceConfiguration

VoiceEvent

VoiceState

---

# Zustand Enhancements

Add:

voiceEnabled

voiceState

microphoneDevice

speakerDevice

currentTranscript

partialTranscript

isSpeaking

isListening

---

# Frontend Components

Create:

VoicePanel.tsx

Purpose:

Voice control center.

Displays:

Current voice state

Selected microphone

Selected speaker

Transcript preview

Voice activity

---

# Microphone Selector

Create:

MicrophoneSelector.tsx

Requirements:

List available microphones.

Allow changing devices.

Persist selection.

---

# Speaker Selector

Create:

SpeakerSelector.tsx

Requirements:

List available speakers.

Allow changing output.

Persist selection.

---

# Voice Status Component

Create:

VoiceStatus.tsx

Display:

Idle

Listening

Processing

Speaking

Disconnected

Error

---

# Push-To-Talk Integration

Integrate existing hotkey system.

When activated:

Start Listening

Capture Speech

Generate Transcript

Send Transcript To Conversation Store

---

# Transcript Integration

Voice transcripts must automatically appear in:

Conversation History

Transcript Panel

Session History

---

# Visualizer Integration

Existing visualizer states must respond to voice state.

Listening

Speaking

Processing

Idle

Error

---

# Backend APIs

Create:

POST

/api/voice/start

POST

/api/voice/stop

POST

/api/voice/speak

GET

/api/voice/status

GET

/api/voice/devices

---

# Mock Mode Support

Create:

MockVoiceProvider

Requirements:

Generate fake transcripts

Generate fake responses

Allow testing without Azure connectivity

---

# Logging

Create:

VoiceLogger.ts

Track:

Session Start

Session Stop

Transcript Events

Speech Output Events

Voice Errors

Device Changes

---

# Settings

Add:

Voice Enabled

Preferred Voice

Preferred Microphone

Preferred Speaker

Voice Volume

Auto Start Listening

Push-To-Talk Enabled

---

# Error Handling

Support:

Microphone Missing

Speaker Missing

Connection Failure

Session Timeout

Permission Denied

---

# Build Requirements

All existing functionality must continue working.

Commands must succeed:

npm install

npm run dev

npm run backend

npm run electron

No TypeScript errors.

No lint errors.

---

# Success Criteria

User can:

- Select microphone
- Select speaker
- Start listening
- Stop listening
- View transcript
- Hear generated speech
- View voice states
- Control sessions

Architecture is ready for:

Phase 5 = Real Azure AI Foundry Voice Live Integration

Phase 6 = Copilot + Voice End-to-End Conversation