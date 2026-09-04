# MUSE Copilot Studio Integration - Setup Guide

## Phase 1: Environment Configuration

This guide walks you through setting up Copilot Studio authentication for MUSE.

### Prerequisites

1. **Azure Subscription** (required)
2. **Copilot Studio access** (create environment in Azure)
3. **Microsoft 365 tenant** (for M365 data access)

### Option 1: OAuth 2.0 (Client Credentials) - Local Development

Best for running MUSE backend locally on your Mac. This uses an Azure AD application registration to authenticate.

#### Step 1: Create Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Name: `muse-local-dev`
5. Supported account types: **Single tenant**
6. Click **Register**

#### Step 2: Create Client Secret

1. In the app registration, go to **Certificates & secrets**
2. Under "Client secrets," click **New client secret**
3. Description: `local-dev-secret`
4. Expires: **6 months** (or your preference)
5. Copy the value immediately (you won't see it again)

#### Step 3: Grant API Permissions

1. In the app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Application permissions**
5. Search and add:
   - `Calendars.Read`
   - `Mail.Read`
   - `Tasks.ReadWrite`
   - `TeamSettings.Read`
   - `Files.Read.All`
6. Click **Grant admin consent for [your-org]**

#### Step 4: Get Your Tenant ID

1. In Azure AD, go to **Overview**
2. Copy the **Directory (tenant) ID**

#### Step 5: Create `.env` file

In `/Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/`, create or update `.env`:

```bash
# Copilot Studio Authentication (OAuth2)
COPILOT_STUDIO_ENDPOINT=https://copilot.microsoft.com/api
COPILOT_STUDIO_CLIENT_ID=<your-app-id>
COPILOT_STUDIO_CLIENT_SECRET=<your-client-secret>
COPILOT_STUDIO_TENANT_ID=<your-tenant-id>

# Backend
PORT=4000
NODE_ENV=development

# Optional: Microsoft Graph
GRAPH_ENDPOINT=https://graph.microsoft.com/v1.0
```

**Replace:**
- `<your-app-id>` → Application ID from app registration
- `<your-client-secret>` → Client secret you just created
- `<your-tenant-id>` → Directory (tenant) ID

#### Step 6: Test Authentication

```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure

# Install deps
npm install

# Start backend
npm run backend
```

In another terminal, test the auth status:

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

---

### Option 2: Managed Identity (Azure Container Apps) - Production

This is the recommended approach when deploying MUSE backend to Azure Container Apps or Azure App Service.

#### Step 1: Create Copilot Studio Environment

1. Go to [Power Platform Admin Center](https://admin.powerplatform.microsoft.com)
2. Create a new Copilot Studio environment
3. Note the **Environment ID** and **Tenant ID**

#### Step 2: Deploy to Azure Container Apps

When you deploy to Azure, the infrastructure creates a managed identity. The backend automatically uses it.

#### Step 3: Configure Copilot Studio Access

In Copilot Studio, grant your managed identity permissions to read data.

---

## Troubleshooting

### 401 Unauthorized

**Problem:** "OAuth2 token request failed: 401"

**Solutions:**
1. Verify `COPILOT_STUDIO_CLIENT_ID` is correct (copy it again from Portal)
2. Verify `COPILOT_STUDIO_CLIENT_SECRET` is correct and not expired
3. Verify `COPILOT_STUDIO_TENANT_ID` matches your Azure AD tenant
4. Check that the app registration hasn't expired

### 403 Forbidden

**Problem:** "API access denied"

**Solutions:**
1. Verify API permissions were granted in app registration
2. Click "Grant admin consent for [org]" again
3. Wait 5 minutes for permissions to propagate

### Connection refused (localhost:4000)

**Problem:** "ECONNREFUSED"

**Solutions:**
1. Start the backend: `npm run backend`
2. Wait 10 seconds for startup
3. Check backend logs for errors

### Missing `.env` file

**Problem:** "Cannot find Copilot Studio credentials"

**Solutions:**
1. Create `.env` in repository root
2. Ensure `.env` is in `.gitignore` (don't commit secrets!)
3. Check that env vars are loaded by backend

---

## Next Steps

Once authentication is working:

1. **Phase 2: Memory Augmentation** - Wire vault context into Copilot prompts
2. **Phase 3: Voice I/O** - Add speech-to-text and text-to-speech
3. **Phase 4: M365 Integration** - Connect Teams, Outlook, Planner actions

See `plan.md` in session artifacts for full roadmap.

---

## Security Notes

- ⚠️ **Never commit `.env` file to Git**
- ⚠️ **Rotate client secrets every 3-6 months**
- ⚠️ **Use Azure Key Vault in production** (not local `.env`)
- ⚠️ **Limit API permissions to minimum required**
- ✅ **Use Managed Identity** in Azure (no client secrets needed)

---

## Architecture Overview

```
Your Electron App (localhost:3000)
         ↓
   Express Backend (localhost:4000)
         ↓
   CopilotStudioAdapter (with auth)
         ↓
   OAuth2 Token Endpoint (Azure AD)
         ↓
   Copilot Studio API
         ↓
   Microsoft Graph API (optional)
```

When you POST to `/api/copilot/chat`:
1. Backend loads `COPILOT_STUDIO_CLIENT_ID` + secret from env
2. Calls Azure AD token endpoint to get access token
3. Sends authenticated request to Copilot Studio API
4. Returns response to frontend

---

## Questions?

Check logs:

```bash
# View backend logs
npm run backend 2>&1 | grep -i copilot

# View environment
env | grep COPILOT
```

File an issue if you need help setting up Copilot Studio credentials.
