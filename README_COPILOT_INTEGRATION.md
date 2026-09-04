# MUSE + Copilot Studio Integration

This directory contains MUSE (Michael's Unified Strategy Engine), a Jarvis-style personal AI assistant designed to work seamlessly with Microsoft 365 and Copilot Studio.

## What's New (Phase 1 - Copilot Studio Integration)

✅ **Core Implementation:**
- `services/src/copilot/CopilotStudioAuth.ts` - OAuth 2.0 / Managed Identity authentication
- `services/src/copilot/CopilotStudioAdapter.ts` - Real Copilot Studio API integration
- `backend/src/services/CopilotStudioIntegration.ts` - Backend service wrapper
- `COPILOT_SETUP.md` - Step-by-step auth setup guide

✅ **Backward Compatible:**
- All existing Express routes work unchanged
- Mock `CopilotService` still available for testing
- Graceful fallback if Copilot Studio credentials are missing

## Quick Start

### 1. Set Up Copilot Studio Authentication

Follow [COPILOT_SETUP.md](./COPILOT_SETUP.md) to configure OAuth 2.0 or Managed Identity.

This creates a `.env` file with:
```
COPILOT_STUDIO_ENDPOINT=...
COPILOT_STUDIO_CLIENT_ID=...
COPILOT_STUDIO_CLIENT_SECRET=...
COPILOT_STUDIO_TENANT_ID=...
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Backend

```bash
npm run backend
```

You should see:
```
MUSE backend listening on http://localhost:4000
Copilot Studio integration initialized
```

### 4. Test Authentication

```bash
curl -X GET http://localhost:4000/api/copilot/status
```

Expected response:
```json
{
  "connected": true,
  "connectionStatus": "connected",
  "lastAuthenticated": "2026-09-04T...",
  "expiresAt": "2026-09-04T..."
}
```

### 5. Send Your First Message to Copilot Studio

```bash
curl -X POST http://localhost:4000/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is a Copilot Studio agent?"
  }'
```

Expected response:
```json
{
  "status": "ok",
  "conversationId": "copilot-conv-...",
  "reply": "A Copilot Studio agent is an AI assistant orchestrated through Microsoft's no-code Copilot Studio platform...",
  "sources": [],
  "message": {
    "content": "...",
    "sources": [],
    "citations": []
  }
}
```

### 6. Stream a Response (SSE)

```bash
curl -X POST http://localhost:4000/api/copilot/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain the 3 key features of Copilot Studio"
  }'
```

This returns Server-Sent Events (SSE) stream, perfect for real-time UI updates.

## Architecture

```
┌────────────────────────────────────┐
│   Electron Desktop Shell           │
│   (System tray, hotkeys, window)   │
└────────────────────────────────────┘
            ↓ (HTTP/WebSocket)
┌────────────────────────────────────┐
│  React Frontend (Vite + Zustand)   │
│  (Chat UI, conversation history)   │
└────────────────────────────────────┘
            ↓ (HTTP)
┌────────────────────────────────────┐
│  Express Backend                   │
│  - ConversationManager             │
│  - MemoryService + VaultIndexer    │
│  - VoiceService (ready)            │
│  - ActionService (ready)           │
│  - NEW: CopilotStudioAdapter       │
└────────────────────────────────────┘
            ↓ (OAuth2 + REST)
┌────────────────────────────────────┐
│  Copilot Studio API                │
│  (Orchestration + Skills)          │
└────────────────────────────────────┘
            ↓
┌────────────────────────────────────┐
│  Microsoft 365 (via Graph API)     │
│  - Teams, Outlook, Planner, etc.   │
└────────────────────────────────────┘
```

## File Structure

```
muse/
├── electron/              # Electron main process (unchanged)
├── frontend/              # React UI (unchanged)
├── backend/               # Express API
│   ├── src/
│   │   ├── routes/        # API endpoints (unchanged)
│   │   │   └── copilot.ts # Updated to use real Copilot Studio
│   │   ├── services/
│   │   │   └── CopilotStudioIntegration.ts  # NEW
│   │   └── index.ts       # Entry point
│   └── package.json
├── services/              # Shared services
│   ├── src/
│   │   └── copilot/
│   │       ├── CopilotStudioAuth.ts        # NEW
│   │       ├── CopilotStudioAdapter.ts     # NEW
│   │       ├── CopilotSessionManager.ts    # Unchanged
│   │       └── ...
│   └── package.json
├── shared/                # Shared types + utilities (unchanged)
├── vault/                 # Local .md vault (Obsidian-compatible)
├── .env                   # SECRETS (gitignored)
├── .env.example           # Template
├── COPILOT_SETUP.md       # Setup guide
└── README.md              # This file
```

## API Endpoints

### Authentication & Status

**GET `/api/copilot/status`**
Get Copilot Studio connection status.

Response:
```json
{
  "connected": true,
  "connectionStatus": "connected",
  "lastAuthenticated": "2026-09-04T...",
  "expiresAt": "2026-09-04T...",
  "error": null
}
```

**POST `/api/copilot/auth/login`**
Force re-authentication.

**POST `/api/copilot/auth/logout`**
Clear cached token.

### Chat

**POST `/api/copilot/chat`**
Send a message and get response.

Request:
```json
{
  "prompt": "What's on my calendar?",
  "context": "Optional context about user",
  "conversationId": "copilot-conv-abc123"  // optional
}
```

Response:
```json
{
  "status": "ok",
  "conversationId": "copilot-conv-abc123",
  "reply": "Based on your calendar...",
  "sources": [
    { "title": "Meeting with John", "sourceType": "meeting" }
  ],
  "message": {
    "content": "Based on your calendar...",
    "sources": [...],
    "citations": [...]
  }
}
```

**POST `/api/copilot/chat/stream`**
Stream response as Server-Sent Events.

### Retrieval

**POST `/api/copilot/retrieve`**
Search work context (files, meetings, projects, tasks).

Request:
```json
{
  "type": "files",
  "query": "Q4 planning",
  "limit": 10
}
```

### Conversation Management

**POST `/api/copilot/conversation/new`**
Create a new conversation.

**GET `/api/copilot/conversation/active`**
Get active conversation.

**GET `/api/copilot/conversation/history`**
List all conversations.

**POST `/api/copilot/conversation/clear`**
Clear active conversation.

## Environment Variables

Required:
- `COPILOT_STUDIO_ENDPOINT` - Copilot Studio API URL
- `COPILOT_STUDIO_CLIENT_ID` - OAuth2 client ID
- `COPILOT_STUDIO_CLIENT_SECRET` - OAuth2 client secret (or leave empty for Managed Identity)
- `COPILOT_STUDIO_TENANT_ID` - Azure AD tenant ID

Optional:
- `PORT` - Backend port (default: 4000)
- `NODE_ENV` - `development` or `production`

See `.env.example` for full template.

## Development

### Run All Services

```bash
npm run dev:all
```

Starts both backend and frontend with hot reload.

### Run Tests (Planned)

```bash
npm run test
```

### Build for Production

```bash
npm run build
```

### Verify Phases

```bash
npm run verify:phase1  # Auth working?
npm run verify:phase2  # Memory augmentation?
npm run verify:phase3  # Voice I/O?
npm run verify:phase4  # M365 integration?
```

## Roadmap

### Phase 1 ✅ (In Progress)
- [x] CopilotStudioAuth (OAuth 2.0 / Managed Identity)
- [x] CopilotStudioAdapter (real API integration)
- [x] Auth status endpoint
- [ ] Test basic chat with Copilot Studio

### Phase 2 (Next)
- [ ] Implement vault context builder
- [ ] Add conversation history context
- [ ] Engineer system prompt for Muse personality
- [ ] Implement streaming responses
- [ ] Test memory-augmented chat

### Phase 3 (Voice I/O)
- [ ] Audio capture from system mic
- [ ] Azure Speech Services integration (STT)
- [ ] Azure Speech Services integration (TTS)
- [ ] Full voice roundtrip test

### Phase 4 (M365 Integration)
- [ ] Microsoft Graph API connector
- [ ] M365 data context injection
- [ ] Actions interpretation layer
- [ ] Copilot Studio skills wiring

## Troubleshooting

### "Cannot find Copilot Studio credentials"
→ Create `.env` file with `COPILOT_STUDIO_*` variables. See [COPILOT_SETUP.md](./COPILOT_SETUP.md).

### 401 Unauthorized from Copilot Studio
→ Verify auth credentials. Try logging out and back in:
```bash
curl -X POST http://localhost:4000/api/copilot/auth/logout
curl -X POST http://localhost:4000/api/copilot/auth/login
```

### Backend won't start
→ Check logs:
```bash
npm run backend 2>&1 | grep -i error
```

### Vault files not found
→ Ensure vault/ directory exists with your .md files. Backend looks for it at repo root.

## Security

⚠️ **Important:**
- Never commit `.env` to Git
- Rotate client secrets every 3-6 months
- Use Azure Key Vault in production (not local `.env`)
- Limit API permissions to minimum required
- Use Managed Identity when running in Azure

## Contributing

When adding new features:
1. Keep mock CopilotService working for testing
2. Update existing routes instead of creating new ones
3. Log integration points for debugging
4. Test with `npm run verify:*` scripts

## License

Same as parent MUSE project.

## Questions?

See session artifacts (`plan.md`) for full architecture & implementation details.
