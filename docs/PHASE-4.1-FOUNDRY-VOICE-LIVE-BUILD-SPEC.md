# PHASE 4.1 BUILD SPECIFICATION

## Project Name

MUSE (Michael's Unified Strategy Engine)

---

# Objective

Replace the Phase 4 mock voice implementations with real Azure AI Foundry Voice functionality.

Phase 4 created abstractions.

Phase 4.1 creates the real implementation.

Do not modify:

- Electron shell
- React UI
- Visualizer
- Conversation system
- Copilot system
- Memory system

Only replace voice provider implementations.

---

# Current State

Current Implementation:

MockSpeechToText

MockTextToSpeech

These provide fake transcripts and fake audio.

Real Azure AI Foundry integration now needs to be implemented behind existing interfaces.

---

# Architectural Rule

Preserve these interfaces exactly:

SpeechToTextEngine

TextToSpeechEngine

Do not change public contracts.

Only add new implementations.

---

# Authentication Requirements

CRITICAL:

MUSE must authenticate using the currently signed-in Azure user.

MUSE must use existing Azure CLI authentication when available.

Supported:

az login

DefaultAzureCredential

AzureCliCredential

Not Allowed:

App Registration

Client Secret

Client Credentials Flow

Service Principal

Managed Identity Requirements

Custom Entra Registration

---

# Azure Resource Configuration

Load configuration from:

docs/azure-resources.md

and

environment variables

Do not hardcode:

Resource Names

Endpoints

Subscription IDs

Keys

Regions

---

# Folder Structure

services/src/voice/foundry/

FoundrySpeechToText.ts

FoundryTextToSpeech.ts

FoundryVoiceLiveClient.ts

FoundryTokenProvider.ts

FoundryVoiceConfiguration.ts

index.ts

---

# FoundryTokenProvider

Create:

FoundryTokenProvider.ts

Responsibilities:

Acquire Azure credentials.

Support:

DefaultAzureCredential

AzureCliCredential

Credential validation

Token acquisition

Connection verification

Methods:

getCredential()

getAccessToken()

validateAuthentication()

getCurrentAuthenticationMode()

---

# FoundryVoiceConfiguration

Create:

FoundryVoiceConfiguration.ts

Responsibilities:

Load configuration.

Support:

Environment Variables

Azure Resource Configuration

Model Selection

Voice Selection

Connection Validation

Methods:

getEndpoint()

getModel()

getVoiceProfile()

validate()

---

# FoundryVoiceLiveClient

Create:

FoundryVoiceLiveClient.ts

Responsibilities:

Connect to Azure AI Foundry Voice Live.

Manage session lifecycle.

Manage connections.

Handle reconnects.

Handle disconnects.

Methods:

connect()

disconnect()

startSession()

endSession()

isConnected()

---

# FoundrySpeechToText

Create:

FoundrySpeechToText.ts

Must implement:

SpeechToTextEngine

Methods:

startStreaming()

stopStreaming()

Requirements:

Use Azure AI Foundry.

Generate partial transcripts.

Generate final transcripts.

Return existing:

TranscriptionChunk

TranscriptionResult

Do not change models.

---

# FoundryTextToSpeech

Create:

FoundryTextToSpeech.ts

Must implement:

TextToSpeechEngine

Methods:

synthesize()

Requirements:

Generate real speech.

Return:

SynthesisResult

Preserve existing interfaces.

Do not change frontend contracts.

---

# Provider Selection

Enhance:

VoiceConfiguration

Allow:

MOCK

FOUNDRY

When:

VOICE_PROVIDER=mock

use:

MockSpeechToText

MockTextToSpeech

When:

VOICE_PROVIDER=foundry

use:

FoundrySpeechToText

FoundryTextToSpeech

No code changes should be required to switch providers.

Configuration only.

---

# Voice Service Integration

Modify:

VoiceService.ts

Requirements:

Resolve provider from configuration.

Inject correct implementation.

Support:

Mock Provider

Foundry Provider

without changing public APIs.

---

# Connection Health

Add:

Connection State Tracking

States:

Connected

Connecting

Disconnected

AuthenticationFailed

Error

Reconnecting

---

# Logging

Create:

FoundryVoiceLogger.ts

Track:

Connection Events

Authentication Events

Session Events

Transcript Events

Speech Events

Errors

Latency

---

# Diagnostics

Create:

VoiceDiagnostics.ts

Methods:

testAuthentication()

testConnectivity()

testSpeechToText()

testTextToSpeech()

getConfiguration()

These diagnostics will be used for troubleshooting.

---

# Backend Routes

Extend:

/api/voice/status

Return:

Provider

Connection State

Authentication State

Selected Model

Selected Voice

Session Status

---

# Voice Status UI

Extend existing:

VoiceStatus

Display:

Provider

Connection Status

Authentication Status

Current Session Status

---

# Error Handling

Handle:

Authentication Failure

Token Expiration

Microphone Failure

Speaker Failure

Network Failure

Voice Live Failure

Configuration Failure

---

# Development Requirements

All existing functionality must continue working.

Application must compile successfully.

Commands:

npm install

npm run dev

npm run backend

npm run electron

No lint errors.

No TypeScript errors.

---

# Success Criteria

The following workflow must work:

Open MUSE

↓

Press Push-To-Talk

↓

Speak

↓

Azure AI Foundry generates transcript

↓

Transcript appears in UI

↓

MUSE generates speech

↓

Speech plays through speakers

No mock transcript generation.

No mock audio generation.

Real Azure AI Foundry voice pipeline operational.

Phase 4.1 complete.