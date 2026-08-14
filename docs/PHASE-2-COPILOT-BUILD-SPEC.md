# PHASE 2 BUILD SPECIFICATION

## Project Name

MUSE (Michael's Unified Strategy Engine)

---

# Mission

Transform the existing Phase 1 MUSE Foundation into a production-ready Jarvis-style desktop assistant.

Phase 1 already provides:

- React UI
- Zustand State Management
- Framer Motion Visualizer
- Transcript Window
- Push-To-Talk UI
- Express Backend
- Session State

Do not replace existing functionality.

Enhance and extend it.

---

# Architectural Vision

MUSE is not a Microsoft Graph crawler.

MUSE is a Personal AI Operating System.

Responsibilities:

## MUSE

Provides:

- Voice Interface
- Personality
- Memory
- Visualizer
- Workflow Automation
- Action Orchestration

## Microsoft 365 Copilot APIs

Provides:

- Enterprise Search
- Enterprise Reasoning
- Microsoft 365 Grounding
- Security Trimming
- Organizational Context

## Azure AI Foundry

Provides:

- Speech To Text
- Text To Speech
- Realtime Audio
- Voice Personalities

## Vault

Provides:

- Long-Term Memory
- Preferences
- Priorities
- Project Context
- Personal Knowledge

---

# Repository Structure

Enhance the existing repository.

Expected structure:

muse/

├── backend/
├── docs/
├── frontend/
├── vault/
├── electron/
├── services/
├── shared/

---

# Electron Desktop Layer

Create:

electron/

main.ts

preload.ts

tray.ts

hotkeys.ts

windowManager.ts

startup.ts

---

## Electron Requirements

### Desktop Application

Convert MUSE into a native desktop application.

Support:

- Windows
- macOS

---

### System Tray

Tray menu:

- Open MUSE
- Hide MUSE
- Settings
- Exit

---

### Global Shortcut

Default Shortcut

Windows:

CTRL + SHIFT + SPACE

macOS:

CMD + SHIFT + SPACE

Behavior:

- Show window
- Focus window
- Start conversation

---

### Window Modes

Implement:

Normal

Always On Top

Mini Mode

Floating Assistant Mode

---

### Startup Option

Support:

Launch MUSE When Computer Starts

Store preference in application settings.

---

# Frontend Enhancements

Preserve all existing components.

Enhance current interface.

---

## Layout

Add:

Left Sidebar

Center Conversation Panel

Right Context Panel

Footer Status Bar

---

### Sidebar

Displays:

- Current Projects
- Recent Conversations
- Memory Shortcuts
- Settings
- Actions

---

### Context Panel

Displays:

- Vault Context
- Active Sources
- Copilot Sources
- Recent Files
- Action Results

---

### Footer

Displays:

- Voice Status
- Connection Status
- Memory Status
- Copilot Status

---

# Visualizer Upgrades

Enhance existing visualizer.

States:

idle

listening

thinking

speaking

alert

error

---

## Idle

Slow pulse

Soft glow

---

## Listening

Waveform animation

Microphone activity

Blue glow

---

## Thinking

Rotating particles

Orbital animation

Purple accent

---

## Speaking

Audio bars

Dynamic pulse

Realtime reaction

---

## Alert

Orange pulse

---

## Error

Red pulse

---

## New State Indicators

Connection Lost

Syncing

Executing Action

Retrieving Context

---

# Conversation System

Create:

ConversationManager.ts

ConversationService.ts

ConversationStore.ts

---

## Requirements

Support:

Conversation History

Conversation Persistence

Conversation Search

Conversation Export

Conversation Summaries

---

# Memory Layer

Create:

services/memory/

MemoryService.ts

SessionMemory.ts

VaultIndexer.ts

MemorySearch.ts

MemoryStore.ts

---

## Vault Structure

vault/

projects/

customers/

learning/

preferences/

priorities/

sessions/

decisions/

meeting-notes/

playbooks/

certifications/

---

## Memory Capabilities

Store:

Preferences

Decisions

Projects

Goals

Action History

Conversation Summaries

Meeting Notes

Technology Notes

---

## Memory Search

Support:

keyword search

semantic search placeholder

tag search

source search

---

# Microsoft 365 Copilot Layer

Create:

services/copilot/

CopilotService.ts

CopilotChatService.ts

CopilotRetrievalService.ts

CopilotSessionManager.ts

CopilotModels.ts

---

# Design Principle

MUSE does not perform enterprise crawling.

MUSE uses Microsoft 365 Copilot APIs as the Enterprise Intelligence Layer.

---

# Copilot Chat Service

Provide interface support for:

- askQuestion()
- continueConversation()
- summarizeContext()
- summarizeMeeting()
- generateDocument()
- generateTasks()

Implement mock responses.

Do not implement hardcoded Graph crawling.

---

# Copilot Retrieval Service

Provide interface support for:

- retrieveWorkContext()
- retrieveFiles()
- retrieveMeetings()
- retrieveProjects()
- retrieveTasks()

Implement mock responses.

---

# Azure AI Foundry Voice Layer

Create:

services/voice/

VoiceService.ts

SpeechToText.ts

TextToSpeech.ts

VoiceSession.ts

AudioManager.ts

---

# Design Goal

Prepare architecture for future Azure AI Foundry Voice integration.

---

## Voice Features

Push To Talk

Streaming Speech

Wake Word Ready

Voice Profiles

Voice Settings

Microphone Selection

Speaker Selection

Conversation Audio Playback

---

# Action Framework

Create:

services/actions/

ActionService.ts

ActionRegistry.ts

ActionExecutor.ts

ActionModels.ts

ActionResult.ts

ActionRequest.ts

---

# Action Plugin Architecture

All actions must register as plugins.

Future integrations:

Outlook

Planner

OneDrive

SharePoint

Teams

OneNote

Loop

Word

Excel

PowerPoint

---

# Action Categories

Information Actions

Create Actions

Update Actions

Delete Actions

Approval Actions

---

# Human Approval Model

MUSE may recommend actions.

MUSE must request user approval before:

Deleting Content

Sending Messages

Modifying Existing Documents

Moving Files

Updating Planner

Modifying Outlook

---

# Backend Services

Create:

backend/src/routes/

copilot.ts

memory.ts

actions.ts

voice.ts

session.ts

health.ts

---

# Endpoints

GET

/health

Returns:

{
  "status": "healthy"
}

---

POST

/api/copilot/chat

Mock response.

---

POST

/api/copilot/retrieve

Mock response.

---

POST

/api/memory/store

Store memory entry.

---

POST

/api/memory/search

Search memory.

---

POST

/api/actions/execute

Execute registered action.

---

POST

/api/session/start

Start MUSE session.

---

POST

/api/session/end

End MUSE session.

---

# Settings System

Create:

SettingsStore.ts

SettingsService.ts

---

Store:

Theme

Voice Settings

Window Mode

Startup Mode

Hotkeys

Memory Preferences

Copilot Preferences

Notification Preferences

---

# Logging

Create:

Logger.ts

AuditLogger.ts

---

Track:

Conversations

Actions

Errors

System Events

Voice Events

---

# Security Model

Design Assumptions:

- User is already authenticated to Microsoft 365.
- MUSE will eventually use Microsoft 365 Copilot APIs.
- MUSE is not a tenant-wide search platform.
- MUSE acts on behalf of the signed-in user.
- User approval is required for consequential actions.

---

# Development Requirements

Must compile successfully.

Must run immediately.

Required commands:

npm install

npm run dev

npm run backend

npm run electron

---

# Technology Requirements

React

TypeScript

Electron

Express

Framer Motion

Zustand

Node.js

---

# Code Quality Requirements

Strict TypeScript

Reusable Components

Service-Based Architecture

Modular Design

Production Quality Code

No Placeholder UI Components

No Dead Code

No Graph Crawling Logic

No Hardcoded Credentials

Prepare all service abstractions for future Microsoft 365 Copilot API integration and future Azure AI Foundry Voice integration.

---

# Phase 2 Success Criteria

MUSE launches as a desktop application.

MUSE runs in Electron.

MUSE supports hotkeys.

MUSE supports tray mode.

MUSE supports memory services.

MUSE supports conversation services.

MUSE supports action services.

MUSE supports voice service abstractions.

MUSE supports Copilot API abstractions.

The architecture is ready for:

Phase 3 = Azure AI Foundry Voice

Phase 4 = Microsoft 365 Copilot API Integration

Phase 5 = Enterprise Actions and Automation