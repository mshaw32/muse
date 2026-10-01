# Complete Copilot Studio Setup & Integration Guide

**Status:** Backend v5 is LIVE and responding ✅  
**Date:** October 1, 2026  
**Task:** Wire backend to Copilot Studio and test end-to-end  
**Expected Time:** 30-45 minutes  

---

## Prerequisites - VERIFY THESE FIRST

### ✅ Backend Deployment Status
```bash
curl https://muse-backend.azurewebsites.net/
```

**Expected:** JSON with service info (you should have this already)

### ✅ Copilot Studio Access
- URL: https://copilotstudio.microsoft.com
- You should have an existing "Muse" agent
- You need Editor role on the agent

### ✅ Azure AD App Registration
You need:
- **Client ID** (Application ID)
- **Client Secret** (Password)
- **Tenant ID:** `de08c407-19b9-427d-9fe8-edf254300ca7` (already configured)

If you don't have these yet, create them in Azure:
1. Go to https://portal.azure.com
2. Search: **App registrations**
3. Click: **+ New registration**
4. Name: `MuseBackend`
5. Click: **Register**
6. Copy **Application (client) ID**
7. Go to **Certificates & secrets**
8. Click: **+ New client secret**
9. Copy the secret value (only shows once!)

---

## Part 1: Set Azure AD Credentials in App Service

This tells your backend how to authenticate with Copilot Studio.

### Step 1.1: Get Your Credentials

From Azure Portal:
- **Client ID:** (copy from App registration)
- **Client Secret:** (copy from Certificates & secrets)
- **Tenant ID:** `de08c407-19b9-427d-9fe8-edf254300ca7`

### Step 1.2: Set Environment Variables

Run this command (replace with YOUR credentials):

```bash
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --settings \
    COPILOT_STUDIO_CLIENT_ID="YOUR-CLIENT-ID-HERE" \
    COPILOT_STUDIO_CLIENT_SECRET="YOUR-CLIENT-SECRET-HERE" \
    COPILOT_STUDIO_TENANT_ID="de08c407-19b9-427d-9fe8-edf254300ca7" \
    NODE_ENV="production"
```

### Step 1.3: Restart the App

```bash
az webapp restart \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend
```

### Step 1.4: Verify Settings

```bash
az webapp config appsettings list \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend | grep COPILOT_STUDIO
```

Should show your 3 settings (not the secret value, just "****").

---

## Part 2: Test Backend Before Wiring to Studio

Verify the backend is properly configured and ready.

### Test 1: Health Check

```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Expected Response:**
```json
{
  "connected": true,
  "timestamp": "2026-10-01T15:38:53Z",
  "uptime": 300
}
```

**What it means:** Backend is running ✅

### Test 2: Chat Endpoint (No Auth)

```bash
curl -X POST https://muse-backend.azurewebsites.net/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello Muse, what is your name?",
    "conversationId": "test-123"
  }'
```

**Expected Response:**
```json
{
  "response": "Hello! I am Muse, your personal AI assistant...",
  "success": true,
  "timestamp": "2026-10-01T15:38:53Z"
}
```

**Note:** May return mock response if auth not fully configured. That's OK for testing.

### Test 3: Health Details

```bash
curl https://muse-backend.azurewebsites.net/health
```

Should return JSON with service health.

**If All Tests Pass:** ✅ Backend is ready for Studio

---

## Part 3: Wire Backend to Copilot Studio

This connects your backend to your Copilot Studio agent.

### Step 3.1: Open Copilot Studio

1. Go to: https://copilotstudio.microsoft.com
2. Sign in with your Microsoft account
3. Click: **My Copilots**
4. Click: **Muse** (to open your agent)

**Expected Screen:** Agent editor with Topics, Actions tabs

### Step 3.2: Create Connection (If Needed)

Some versions of Copilot Studio require a connection:

1. Click: **+ Add connection**
2. Choose: **Custom connector** or **HTTP**
3. Name: `MuseBackend`
4. Base URL: `https://muse-backend.azurewebsites.net`
5. Authentication: **OAuth 2.0**
6. Enter your Client ID and Secret from Azure AD
7. Click: **Save**

(Or skip this if your Studio version doesn't require it)

### Step 3.3: Create Power Automate Flow

This creates the integration between Studio and your backend:

1. In Copilot Studio, click: **Actions** tab
2. Click: **+ Add an action**
3. Choose: **Create a new cloud flow**
4. Select: **Cloud flow** → **Automated cloud flow**
5. Name: `MuseBackendChat`
6. Choose trigger: **When Copilot requests an action** (or similar)
7. Click: **Create**

**You're now in Power Automate**

### Step 3.4: Add HTTP Action in Power Automate

1. Click: **+ New step**
2. Search: `HTTP`
3. Select: **HTTP** action
4. Configure:

```
Method:     POST
URI:        https://muse-backend.azurewebsites.net/api/copilot/chat
Headers:    
  Key: Content-Type
  Value: application/json
  
  Key: Authorization
  Value: Bearer [YOUR-TOKEN]  (or leave empty if not required)

Body:
{
  "message": @{triggerBody()?['text']},
  "conversationId": @{triggerBody()?['conversationId']},
  "userId": @{triggerBody()?['userId']}
}
```

### Step 3.5: Parse Response in Power Automate

1. Click: **+ New step**
2. Search: `Parse JSON`
3. Select: **Parse JSON**
4. In "Content" field: Select the **Body** output from HTTP action
5. In "Schema" field, paste:

```json
{
  "type": "object",
  "properties": {
    "response": { "type": "string" },
    "success": { "type": "boolean" },
    "timestamp": { "type": "string" }
  }
}
```

6. Click: **Save**

### Step 3.6: Return Response

1. Click: **+ New step**
2. Search: `Response`
3. Select: **Response** action
4. Configure:

```
Status Code:  200
Body:
{
  "response": @{body('Parse_JSON')?['response']},
  "success": @{body('Parse_JSON')?['success']},
  "timestamp": @{body('Parse_JSON')?['timestamp']}
}
```

5. Click: **Save**
6. Go back to Copilot Studio

### Step 3.7: Wire Flow to Agent Message Handler

Back in Copilot Studio:

1. Click: **Topics** tab
2. Click: **Conversation starter** or **Message** topic
3. In the message handler, add a step:
   - Click: **+ Add action**
   - Select: **Call MuseBackendChat** (your flow name)
4. Map inputs:
   - `text` = User message
   - `conversationId` = Conversation ID (generate or use existing)
   - `userId` = Current user
5. In the response, add:
   - Click: **Send a message**
   - Type: `@{outputs('Call_MuseBackendChat')?['body']?['response']}`
6. Click: **Save**

---

## Part 4: Publish the Agent

### Step 4.1: Publish

1. In Copilot Studio, click: **Publish** (top right)
2. Choose channel:
   - **Web Chat** (for browser testing)
   - **Microsoft Teams** (for Teams)
   - **Custom app** (for Electron frontend)
3. Click: **Publish**

**Wait:** 1-2 minutes for publishing

### Step 4.2: Verify Published

After publishing:
- Status shows: **Published**
- You get a URL for Web Chat
- Teams app is available if you chose Teams

---

## Part 5: End-to-End Testing

### Test 5.1: Via Web Chat (Easiest)

1. In Copilot Studio, click: **Web Chat** (bottom right)
2. Wait for chat window to load
3. Type: `Hello Muse`
4. **Expected:** Response from your backend (not a mock response)

**How to verify it's from the backend:**
- Check timing (if response is immediate, it's probably mock)
- Ask something specific: "What is today's date?"
- Backend should know real date, not a fixed response

### Test 5.2: Check Logs to Confirm Backend Processing

```bash
# View backend logs in real-time
az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend
```

**Look for:**
- `POST /api/copilot/chat` request log
- Your message in the log
- Backend processing messages

### Test 5.3: Via Microsoft Teams (If Published There)

1. Open Microsoft Teams
2. Apps → Search "Muse" → Open the app
3. Type a message
4. Verify response from backend

### Test 5.4: Via Electron App (If Configured)

1. Open the Muse Electron app (Launch MUSE.command)
2. Click: **Chat**
3. Type a message
4. Verify response from backend

---

## Troubleshooting

### Problem: "401 Unauthorized" or Auth Errors

**Cause:** Azure AD credentials not set or incorrect

**Fix:**
1. Verify you set environment variables:
   ```bash
   az webapp config appsettings list \
     --resource-group rg-mbgsol-muse-dev \
     --name muse-backend | grep COPILOT_STUDIO
   ```
2. Check credentials are correct (don't copy a truncated secret)
3. Make sure Client Secret hasn't expired
4. Restart app: `az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend`

### Problem: Flow Can't Connect to Backend

**Cause:** Network issue or wrong URL

**Fix:**
1. Test manually: `curl https://muse-backend.azurewebsites.net/api/copilot/chat`
2. Check URL in Power Automate is exactly right
3. Check App Service is running: `az webapp show --resource-group rg-mbgsol-muse-dev --name muse-backend | grep state`
4. If running, check logs: `az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend`

### Problem: No Response in Web Chat

**Cause:** Flow not connected correctly or message not reaching backend

**Fix:**
1. Check Power Automate flow runs:
   - Go to https://flow.microsoft.com
   - Find **MuseBackendChat** flow
   - Click **Run history**
   - Check for failed runs
2. If failed, click the failed run to see error
3. Common issues:
   - Wrong output field name in Parse JSON
   - Response format doesn't match expected schema
   - Flow action not called from agent

### Problem: Mock Response Instead of Real Response

**Cause:** Backend is in mock mode (auth not configured or failed)

**Fix:**
1. Check environment variables are set
2. Restart app with: `az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend`
3. Wait 30 seconds, then test again
4. Check logs for auth errors

### Problem: Conversation Context Not Working

**Cause:** Conversation ID not being passed through

**Fix:**
1. In Power Automate, verify you're passing `conversationId` from Studio
2. Check backend logs show `conversationId` value
3. Update flow to capture conversation ID:
   - Add step to generate/store conversation ID
   - Pass same ID on subsequent messages

---

## Architecture Overview

```
User Types Message
        ↓
Copilot Studio (web chat)
        ↓
Power Automate Flow (MuseBackendChat)
        ↓
HTTP POST to /api/copilot/chat
        ↓
Muse Backend (Node.js Express)
        ↓
Copilot Integration Service
        ↓
Response JSON
        ↓
Power Automate parses response
        ↓
Copilot Studio displays message
        ↓
User sees Muse response
```

---

## Backend API Details

### POST /api/copilot/chat
**Purpose:** Send message to Muse, get response

**Request:**
```json
{
  "message": "Hello Muse",
  "conversationId": "conv-123",
  "userId": "user-456"
}
```

**Response (Success):**
```json
{
  "response": "Hello! I am Muse...",
  "success": true,
  "timestamp": "2026-10-01T15:38:53Z"
}
```

**Response (Error):**
```json
{
  "response": "Error: Unable to process message",
  "success": false,
  "error": "auth_failed"
}
```

### GET /api/copilot/status
**Purpose:** Check if backend is alive

**Response:**
```json
{
  "connected": true,
  "timestamp": "2026-10-01T15:38:53Z",
  "uptime": 300
}
```

### GET /health
**Purpose:** Detailed health check

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "copilotStudio": "connected",
    "vault": "available"
  }
}
```

---

## Environment Variables Reference

These are set on your App Service:

```
COPILOT_STUDIO_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
COPILOT_STUDIO_CLIENT_SECRET=****** (hidden in portal)
COPILOT_STUDIO_TENANT_ID=de08c407-19b9-427d-9fe8-edf254300ca7
NODE_ENV=production
```

**To view/edit:**
1. Portal → muse-backend → Configuration
2. Application settings section
3. Edit or add new settings

---

## Success Criteria Checklist

✅ Backend health check passes  
✅ Azure AD credentials set in App Service  
✅ Power Automate flow created  
✅ Flow connected to backend endpoint  
✅ Copilot Studio agent updated with flow  
✅ Agent published  
✅ Web Chat responds (not mock)  
✅ Logs show backend processing message  
✅ Multiple messages work (conversation continuity)  
✅ Ready for next phase (Phase 2 features)  

---

## Next Steps

After end-to-end testing works:

1. **Phase 2 - Conversation Context**
   - Add conversation history to prompts
   - Implement vault context retrieval
   - Engineer system prompt for personality

2. **Phase 3 - Voice I/O**
   - Integrate Azure Speech Services (STT/TTS)
   - Add Electron app hotkey for voice
   - Test voice roundtrip

3. **Phase 4 - Microsoft 365 Integration**
   - Wire Graph API for Teams, Outlook, Planner
   - Create Copilot actions for M365 operations
   - Test end-to-end M365 tasks

---

## Quick Reference Commands

```bash
# Test backend is alive
curl https://muse-backend.azurewebsites.net/

# Test chat endpoint
curl -X POST https://muse-backend.azurewebsites.net/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","conversationId":"test"}'

# Set environment variables
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --settings COPILOT_STUDIO_CLIENT_ID="xxx" ...

# View environment variables
az webapp config appsettings list \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend

# Restart app
az webapp restart \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend

# View logs
az webapp log tail \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend

# Check app status
az webapp show \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend | grep state
```

---

## Support

**Stuck on a step?**
1. Check troubleshooting section above
2. Verify all prerequisites are met
3. Check backend logs for error details
4. Check Power Automate flow run history

**Backend not responding?**
- Verify App Service status: should be "Running" (green)
- Check for recent deployments that may have failed
- View logs to see error messages

**Still stuck?**
- Note which step you're on
- Provide error message from Portal or Power Automate
- Check Power Automate flow history for failed runs

---

**Status: Ready to configure Copilot Studio**

Your backend is live. You have all the pieces. Follow these steps to wire them together and test end-to-end.

Expected time: 30-45 minutes to complete all steps and verify it works.

Good luck! 🚀

