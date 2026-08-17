# PHASE 3 BUILD SPECIFICATION

## Project Name

MUSE (Michael's Unified Strategy Engine)

---

# Objective

Connect MUSE to Microsoft 365 Copilot APIs.

Phase 3 introduces the Enterprise Intelligence Layer.

This phase focuses exclusively on:

- Copilot Chat
- Copilot Retrieval
- Conversation Streaming
- Source Attribution
- Authentication Framework
- Grounded Responses

Do not implement voice.

Do not implement Outlook actions.

Do not implement Planner actions.

Do not implement Microsoft Graph crawling.

---

# Architecture

MUSE
|
+-- Electron Desktop
|
+-- React Frontend
|
+-- Express Backend
|
+-- Microsoft 365 Copilot APIs

---

# Repository Structure

backend/

src/

services/

copilot/

CopilotAuthService.ts

CopilotChatService.ts

CopilotRetrievalService.ts

CopilotConversationService.ts

CopilotModels.ts

CopilotTypes.ts

routes/

copilot.ts

frontend/

src/

services/

copilot/

CopilotClient.ts

CopilotModels.ts

components/

ChatInput.tsx

SourcePanel.tsx

CopilotStatus.tsx

hooks/

useCopilot.ts

---

# Authentication Layer

Create:

CopilotAuthService.ts

Responsibilities:

- Authentication abstraction
- Session status
- Token status
- Authentication state

Implement:

isAuthenticated()

authenticate()

logout()

getAccessToken()

Use mock implementation.

No hardcoded credentials.

No secrets.

No actual authentication yet.

---

# Copilot Types

Create models for:

Conversation

Message

Prompt

Response

Source

Citation

RetrievalResult

ConversationState

---

# Backend APIs

Create:

POST

/api/copilot/chat

Request:

{
  "prompt": "string",
  "conversationId": "string"
}

Response:

{
  "reply": "string",
  "sources": []
}

---

POST

/api/copilot/retrieve

Request:

{
  "query": "string"
}

Response:

{
  "results": []
}

---

GET

/api/copilot/status

Response:

{
  "connected": true
}

---

# Copilot Chat Service

Create:

CopilotChatService.ts

Methods:

sendPrompt()

continueConversation()

resetConversation()

streamResponse()

summarizeConversation()

---

# Mock Engine

Until real integration exists:

Generate realistic mock responses.

Return citations.

Return sources.

Simulate streaming responses.

---

# Copilot Retrieval Service

Create:

CopilotRetrievalService.ts

Methods:

searchFiles()

searchMeetings()

searchProjects()

searchTasks()

searchContext()

Use mock implementation only.

Do not crawl anything.

---

# Frontend Chat Experience

Create:

ChatInput.tsx

Requirements:

- multiline input
- send button
- enter to send
- shift-enter new line

---

# Transcript Enhancements

Add:

Source Attribution

Citation Support

Streaming Message Support

Timestamp Support

Copy Response Button

---

# Source Panel

Create:

SourcePanel.tsx

Displays:

Sources returned from Copilot services.

File sources.

Meeting sources.

Project sources.

Conversation sources.

Use mock data.

---

# Copilot Status Component

Create:

CopilotStatus.tsx

States:

Connected

Disconnected

Authenticating

Error

Mock implementation.

---

# Zustand Enhancements

Add:

currentConversation

copilotStatus

sources

streamingState

retrievalResults

---

# Conversation Management

Implement:

New Conversation

Continue Conversation

Clear Conversation

Conversation History

Conversation Export

---

# Streaming Support

Implement simulated streaming.

Responses should render gradually.

Backend should stream chunks.

Frontend should render incrementally.

---

# UI Requirements

Add:

Conversation Header

Copilot Status Indicator

Source Panel

Streaming Indicator

Typing Indicator

---

# Logging

Create:

CopilotLogger.ts

Track:

Prompt

Response

Sources

Errors

Latency

---

# Security Requirements

No secrets.

No credentials.

No API keys.

No Graph crawling.

No Outlook access.

No SharePoint access.

No Planner access.

Provide clean abstraction layers only.

---

# Build Requirements

Application must compile successfully.

Application must run.

Commands:

npm install

npm run dev

npm run backend

npm run electron

No TypeScript errors.

No linting errors.

---

# Success Criteria

MUSE can:

- Send prompts
- Receive responses
- Stream responses
- Display sources
- Maintain conversations
- Export conversations
- Simulate enterprise grounding

Architecture is ready for real Microsoft 365 Copilot API integration in Phase 4.