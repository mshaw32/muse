# Muse Documentation

This folder contains all documentation for the Muse project — a Jarvis-style personal AI assistant integrating with Microsoft 365 Copilot and Azure services.

## 📋 Quick Navigation

### 🚀 For Immediate Deployment
- **[FINAL_DEPLOYMENT_SUMMARY.md](FINAL_DEPLOYMENT_SUMMARY.md)** — Latest deployment fixes (Sept 30)
  - npm 404 error root cause analysis
  - All code changes documented
  - Deployment package ready
  - **START HERE** for current deployment status

- **[PORTAL_DEPLOYMENT_MANUAL_STEPS.md](PORTAL_DEPLOYMENT_MANUAL_STEPS.md)** — Azure Portal upload instructions
  - Step-by-step manual deployment via Portal UI
  - Useful when CLI deployment fails (e.g., corporate proxy issues)

### 🏗️ For Architecture & Planning
- **[PROJECT-STATUS.md](PROJECT-STATUS.md)** — Architecture overview (Aug 18)
  - High-level system design
  - Component descriptions
  - Technology stack
  - Current phase status

- **[azure-resources.md](azure-resources.md)** — Azure infrastructure needed
  - Lists all Azure services required
  - Resource group configuration
  - Credentials and access setup

### ⚙️ For Running & Configuration
- **[RUNNING-THE-APP.md](RUNNING-THE-APP.md)** — Day-to-day operations
  - Start/stop procedures
  - Environment setup
  - Development vs production modes

- **[COPILOT_SETUP.md](COPILOT_SETUP.md)** — Copilot integration setup
  - Copilot Studio configuration
  - API connections
  - Authentication setup

- **[COPILOT_STUDIO_WIRING.md](COPILOT_STUDIO_WIRING.md)** — Agent wiring guide
  - How to connect Copilot Studio agent to backend
  - Skill creation and linking
  - Testing the agent integration

### 🔧 For Troubleshooting
- **[CORPORATE_PROXY_TROUBLESHOOTING.md](CORPORATE_PROXY_TROUBLESHOOTING.md)** — Network issues
  - Zscaler proxy bypass techniques
  - Azure CLI TLS certificate handling
  - npm registry access

- **[START_HERE.md](START_HERE.md)** — Getting oriented
  - Project overview
  - First-time setup checklist

---

## 📊 Project Phases

### ✅ Phase 1: Backend Deployment (Current)
**Status:** COMPLETE (Sept 30 - Fixed npm 404 error)
- Backend Express app with 21+ endpoints
- Azure App Service deployment
- ✅ Stubs for Phases 2-4 in place

**Reference:** [FINAL_DEPLOYMENT_SUMMARY.md](FINAL_DEPLOYMENT_SUMMARY.md)

### 🔵 Phase 2: Memory & Conversation
**Status:** PLANNED
- Implement real semantic search with embeddings
- Obsidian vault integration
- Conversation history and context
- Voice-activated memory commands

**Reference:** [PHASE-2-COPILOT-BUILD-SPEC.md](PHASE-2-COPILOT-BUILD-SPEC.md)

### 🔵 Phase 3: Voice Integration
**Status:** PLANNED
- Azure Speech Services text-to-speech
- Azure Speech Services speech-to-text
- Real-time audio streaming
- Voice profile management

**Reference:** [PHASE-3 COPILOT-INTEGRATION-BUILD-SPEC.MD](PHASE-3%20COPILOT-INTEGRATION-BUILD-SPEC.MD)

### 🔵 Phase 4: Microsoft 365 Actions
**Status:** PLANNED
- Microsoft Graph integration
- Teams chat creation
- Outlook email sending
- Planner task creation
- OneDrive file access
- Calendar event management

**Reference:** [PHASE-4-VOICE-INTEGRATION-BUILD-SPEC.md](PHASE-4-VOICE-INTEGRATION-BUILD-SPEC.md)

### 🔵 Phase 4.1: Real-time Voice
**Status:** PLANNED
- Azure AI Foundry real-time voice sessions
- Low-latency audio streaming
- Simultaneous TTS/STT for conversational feel
- Interruption handling

**Reference:** [PHASE-4.1-FOUNDRY-VOICE-LIVE-BUILD-SPEC.md](PHASE-4.1-FOUNDRY-VOICE-LIVE-BUILD-SPEC.md)

---

## 📁 File Organization

| File | Purpose | Status | Last Updated |
|------|---------|--------|---------------|
| FINAL_DEPLOYMENT_SUMMARY.md | Latest deployment status | 🟢 Current | Sept 30 |
| PROJECT-STATUS.md | Architecture reference | 🟡 Needs refresh | Aug 18 |
| RUNNING-THE-APP.md | Operational guide | 🟡 Check validity | Sept 4 |
| COPILOT_SETUP.md | Integration setup | 🟢 Active | Sept 4 |
| COPILOT_STUDIO_WIRING.md | Agent wiring | 🟢 Active | Sept 4 |
| CORPORATE_PROXY_TROUBLESHOOTING.md | Network troubleshooting | 🟢 Active | Sept 4 |
| PORTAL_DEPLOYMENT_MANUAL_STEPS.md | Manual deployment | 🟢 Active | Sept 4 |
| START_HERE.md | Getting started | 🟡 Supplement with FINAL_DEPLOYMENT_SUMMARY | Sept 4 |
| COPILOT-BUILD.SPEC.md | Phase 1 spec (historical) | ⚫ Archived | Sept 4 |
| PHASE-2-COPILOT-BUILD-SPEC.md | Phase 2 spec | 🟢 Active | Sept 4 |
| PHASE-3 COPILOT-INTEGRATION-BUILD-SPEC.MD | Phase 3 spec | 🟢 Active | Sept 4 |
| PHASE-4-VOICE-INTEGRATION-BUILD-SPEC.md | Phase 4 spec | 🟢 Active | Sept 4 |
| PHASE-4.1-FOUNDRY-VOICE-LIVE-BUILD-SPEC.md | Phase 4.1 spec | 🟢 Active | Sept 4 |
| azure-resources.md | Infrastructure list | 🟢 Active | Sept 4 |

---

## 🎯 Recommended Reading Order

### For Users Deploying Now
1. [FINAL_DEPLOYMENT_SUMMARY.md](FINAL_DEPLOYMENT_SUMMARY.md) — Understand the latest fixes
2. [PORTAL_DEPLOYMENT_MANUAL_STEPS.md](PORTAL_DEPLOYMENT_MANUAL_STEPS.md) — Execute deployment
3. [RUNNING-THE-APP.md](RUNNING-THE-APP.md) — Start the app
4. [COPILOT_STUDIO_WIRING.md](COPILOT_STUDIO_WIRING.md) — Connect the agent

### For Developers
1. [PROJECT-STATUS.md](PROJECT-STATUS.md) — Understand architecture
2. [RUNNING-THE-APP.md](RUNNING-THE-APP.md) — Set up dev environment
3. [PHASE-2-COPILOT-BUILD-SPEC.md](PHASE-2-COPILOT-BUILD-SPEC.md) — Plan Phase 2 work
4. [azure-resources.md](azure-resources.md) — Verify Azure setup

### For Corporate Environment Users
1. [CORPORATE_PROXY_TROUBLESHOOTING.md](CORPORATE_PROXY_TROUBLESHOOTING.md) — Resolve network issues
2. [FINAL_DEPLOYMENT_SUMMARY.md](FINAL_DEPLOYMENT_SUMMARY.md) — Continue with deployment

---

## 📝 Notes on Documentation Cleanup

**Recent changes (Sept 30):**
- ✅ Consolidated 9 duplicate deployment guides into FINAL_DEPLOYMENT_SUMMARY.md
- ✅ Moved all docs from project root to docs/ folder
- ✅ Removed outdated: AZURE_PORTAL_DEPLOYMENT*.md, DEPLOYMENT_*.md, POST_DEPLOYMENT_CHECKLIST.md
- ✅ Kept essential: Phase specs, architecture, and operational guides
- ✅ Created this README.md for navigation

**Docs marked for future update:**
- PROJECT-STATUS.md (last updated Aug 18, needs refresh for Phase 1 completion)
- RUNNING-THE-APP.md (verify current run instructions still valid)

---

## 🔗 Related Files

**In project root:**
- `muse-backend-deploy.zip` — Production deployment package (28 KB)
- `package.json` — Dependencies and build scripts
- `README.md` — Project overview

**In backend/:**
- `src/` — TypeScript source code
- `dist/` — Compiled JavaScript
- `package.json` — Backend dependencies

**In frontend/:**
- `src/` — React TypeScript components
- `vite.config.ts` — Build configuration

**In electron/:**
- `main.ts` — Electron entry point
- `preload.ts` — IPC bridge

---

**Last updated:** Sept 30, 2024  
**Documentation version:** Phase 1 Complete (Deployment Ready)
