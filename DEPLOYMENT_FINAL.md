# MUSE Copilot Studio Agent - FINAL DEPLOYMENT GUIDE

**Status:** All backend code ready. Code is committed and pushed. Ready for production deployment.

---

## Prerequisites

Before you start, ensure you have:
- ✅ Azure subscription (with rg-mbgsol-muse-dev resource group)
- ✅ Azure App Service created (or will create as part of deployment)
- ✅ Access to Copilot Studio (https://copilotstudio.microsoft.com)
- ✅ Azure CLI installed (`az --version`)
- ✅ Access to Azure AD tenant

---

## Quick Start (Automated)

Run the deployment script to automate everything:

```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure
chmod +x deploy.sh
./deploy.sh
```

**What the script does:**
1. ✅ Creates/updates Azure AD app registration (OAuth2)
2. ✅ Deploys backend to App Service
3. ✅ Sets all required environment variables
4. ✅ Tests connectivity
5. ⚠️ Guides you through manual Copilot Studio agent creation

**Time:** ~15 minutes

---

## Manual Deployment (Step-by-Step)

If you prefer to run commands manually, follow these steps:

### Step 1: Authenticate to Azure
```bash
az login --tenant de08c407-19b9-427d-9fe8-edf254300ca7
az account set --subscription e37ff56d-6804-43a3-b7eb-a4952f1f89e3
```

### Step 2: Create/List App Registrations
```bash
# Create new app registration
az ad app create \
  --display-name "muse-copilot-agent" \
  --web-redirect-uris "https://YOUR_APP_SERVICE_NAME.azurewebsites.net/auth/callback"

# Save the AppId from output
APP_ID="<from-output>"

# Or list existing ones
az ad app list --filter "displayName eq 'muse-copilot-agent'" --query "[].{name:displayName, id:appId}"
```

### Step 3: Create Client Secret
```bash
az ad app credential reset --id $APP_ID --display-name "muse-deployment-$(date +%s)"
# Save the password from output
CLIENT_SECRET="<password-from-output>"
```

### Step 4: Deploy Backend
```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure

# Option A: Deploy to existing App Service
az webapp up \
  --name YOUR_APP_SERVICE_NAME \
  --resource-group rg-mbgsol-muse-dev \
  --runtime "node|18" \
  --language typescript

# Option B: Create new App Service and deploy
az appservice plan create \
  --name MuseAppPlan \
  --resource-group rg-mbgsol-muse-dev \
  --sku B2

az webapp create \
  --resource-group rg-mbgsol-muse-dev \
  --plan MuseAppPlan \
  --name YOUR_APP_SERVICE_NAME \
  --runtime "NODE|18"

az webapp up --name YOUR_APP_SERVICE_NAME --resource-group rg-mbgsol-muse-dev
```

### Step 5: Set Environment Variables
```bash
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name YOUR_APP_SERVICE_NAME \
  --settings \
    COPILOT_STUDIO_ENDPOINT="https://copilot.microsoft.com/api" \
    COPILOT_STUDIO_CLIENT_ID="$APP_ID" \
    COPILOT_STUDIO_CLIENT_SECRET="$CLIENT_SECRET" \
    COPILOT_STUDIO_TENANT_ID="de08c407-19b9-427d-9fe8-edf254300ca7" \
    NODE_ENV="production" \
    PORT="8080"
```

### Step 6: Verify Deployment
```bash
# Check if app is running
curl -X GET https://YOUR_APP_SERVICE_NAME.azurewebsites.net/api/copilot/status

# Expected output:
# { "connected": true, "connectionStatus": "connected", ... }
```

### Step 7: Create Copilot Studio Agent (Manual UI)

Go to https://copilotstudio.microsoft.com and follow these steps:

#### 7a. Create Agent
1. Click **Create** → **Agent**
2. Name: `Muse`
3. Description: `Personal AI assistant integrated with Microsoft 365`

#### 7b. Add System Prompt
1. Click **Agent Settings** → **Instructions**
2. Add system prompt:
```
You are Muse, a personal AI assistant designed to help users manage their work and life seamlessly within the Microsoft ecosystem.

Key traits:
- Helpful, intelligent, and personalized
- Integrated with Teams, Outlook, Planner, OneDrive, SharePoint
- Can perform actions like creating meetings, sending emails, managing tasks
- Remembers context from previous conversations
- Proactive in offering suggestions

When responding:
- Be concise but helpful
- Reference user's calendar, tasks, and emails when relevant
- Suggest actions you can take (e.g., "I can create that meeting for you")
- Always confirm before taking actions
```

#### 7c. Create OAuth2 Connector
1. Click **Connectors** → **Create new**
2. Type: `OAuth2` (OIDC)
3. Name: `MuseBackend`
4. Configuration:
   - **Client ID:** `$APP_ID` (from Step 3)
   - **Client Secret:** `$CLIENT_SECRET` (from Step 3)
   - **Token Endpoint:** `https://login.microsoftonline.com/de08c407-19b9-427d-9fe8-edf254300ca7/oauth2/v2.0/token`
   - **Scope:** `https://YOUR_APP_SERVICE_NAME.azurewebsites.net/.default`

#### 7d. Add Send Message Action
1. Click **Actions** → **Add action**
2. Name: `Send Message`
3. Type: `REST API`
4. Method: `POST`
5. URL: `https://YOUR_APP_SERVICE_NAME.azurewebsites.net/api/copilot/chat`
6. Authentication: Select the `MuseBackend` connector
7. Body:
```json
{
  "prompt": "<user_message>",
  "conversationId": "<conversation_id>"
}
```

#### 7e. Wire Action to Chat
1. In the canvas editor, set the chat message action to call your `Send Message` action
2. Parse the response and display to user

#### 7f. Test
1. Click **Test**
2. Type: "Hello, who are you?"
3. Verify response comes from your backend

#### 7g. Publish
1. Click **Publish**
2. Choose deployment environment
3. Confirm

---

## Validation Checklist

After deployment, verify everything works:

### Backend Validation
- [ ] `curl https://YOUR_APP_SERVICE_NAME.azurewebsites.net/api/copilot/status` returns `connected: true`
- [ ] `curl -X POST https://YOUR_APP_SERVICE_NAME.azurewebsites.net/api/copilot/chat -H "Content-Type: application/json" -d '{"prompt": "Test"}'` returns real response
- [ ] App Service logs show no 500 errors
- [ ] Token refresh logs show successful OAuth2 flows

### Copilot Studio Validation
- [ ] Agent "Muse" exists and is published
- [ ] Chat test returns response (not error)
- [ ] Response comes from your backend (not a generic response)
- [ ] Connector shows "Connected" status

### End-to-End Validation
- [ ] In Copilot Studio chat: "What's your name?"
- [ ] Should respond: "I'm Muse, your personal AI assistant..."
- [ ] In Copilot Studio chat: "Create a reminder"
- [ ] Should respond: "I can create a reminder for you. When and what would you like to remind yourself about?"

---

## Troubleshooting

### Error: `401 Unauthorized`
**Cause:** OAuth2 credentials are incorrect
**Solution:**
1. Verify `COPILOT_STUDIO_CLIENT_ID` matches Azure AD app registration ID
2. Verify `COPILOT_STUDIO_CLIENT_SECRET` is correct (may have expired)
3. Verify `COPILOT_STUDIO_TENANT_ID` matches your Azure AD tenant ID
4. Recreate client secret if expired:
   ```bash
   az ad app credential reset --id $APP_ID
   ```
5. Update App Service settings with new secret

### Error: `404 Not Found`
**Cause:** App Service URL is wrong or endpoint doesn't exist
**Solution:**
1. Verify App Service is running: `az webapp show --name YOUR_APP_SERVICE_NAME --query "state"`
2. Verify URL in Copilot Studio connector ends with `/api/copilot` (not `/api/copilot/chat`)
3. Check backend logs: `az webapp log tail --name YOUR_APP_SERVICE_NAME --resource-group rg-mbgsol-muse-dev`

### Error: `Backend returned 503`
**Cause:** Backend crashed or is restarting
**Solution:**
1. Check application logs: `az webapp log tail --name YOUR_APP_SERVICE_NAME --resource-group rg-mbgsol-muse-dev`
2. Verify env vars are set correctly: `az webapp config appsettings list --name YOUR_APP_SERVICE_NAME --resource-group rg-mbgsol-muse-dev`
3. Restart app: `az webapp restart --name YOUR_APP_SERVICE_NAME --resource-group rg-mbgsol-muse-dev`

### Copilot Studio Agent Not Responding
**Cause:** Agent not published or connector misconfigured
**Solution:**
1. Go to https://copilotstudio.microsoft.com
2. Open "Muse" agent
3. Check status shows "Published"
4. Click **Connectors** and verify "MuseBackend" shows green checkmark
5. Check connector OAuth2 settings match your Azure AD app registration
6. Re-test the action by clicking **Test** in the agent editor

---

## Next Steps (After Validation)

### Phase 2: Add Memory Augmentation (Optional)
Enable vault context in prompts:
1. Backend already has `MemoryService` + `VaultIndexer`
2. Update prompt in `CopilotStudioAdapter.ts` to include vault context
3. Redeploy backend

### Phase 3: Add Voice I/O (Optional)
1. Install Azure Speech Services SDK
2. Add endpoints: `POST /api/voice/transcribe`, `POST /api/voice/speak`
3. Update Electron app to call voice endpoints
4. Test with voice hotkey

### Phase 4: Add M365 Actions (Optional)
1. Create endpoints for Teams, Outlook, Planner actions
2. Register Microsoft Graph permissions
3. Add actions to Copilot Studio agent
4. Test M365 operations (create meeting, send email, etc.)

---

## Key Values Reference

Save these for future deployments:

```
Subscription ID: e37ff56d-6804-43a3-b7eb-a4952f1f89e3
Resource Group: rg-mbgsol-muse-dev
Tenant ID: de08c407-19b9-427d-9fe8-edf254300ca7
Project Name: mbgsol-muse-dev

App Service Name: [YOUR CHOICE]
App Service URL: https://[YOUR CHOICE].azurewebsites.net

Azure AD App Registration:
  Name: muse-copilot-agent
  Client ID: [GENERATED]
  Client Secret: [GENERATED - keep secret!]

Copilot Studio Agent:
  Name: Muse
  Environment: [YOUR ENVIRONMENT]
  Published: Yes/No
```

---

## Support

If you encounter issues:
1. Check troubleshooting section above
2. Review backend logs: `az webapp log tail --name YOUR_APP_SERVICE_NAME --resource-group rg-mbgsol-muse-dev`
3. Verify all env vars are set: `az webapp config appsettings list --name YOUR_APP_SERVICE_NAME --resource-group rg-mbgsol-muse-dev`
4. Check Copilot Studio connector status and re-test
5. If still stuck, check the docs:
   - `README_COPILOT_INTEGRATION.md` - API reference
   - `COPILOT_SETUP.md` - OAuth2 setup details

---

**Status:** Ready for deployment. All code is committed and pushed to branch `mshaw32-copilot-muse-feasibility`.

Good luck! 🚀
