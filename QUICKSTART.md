# MUSE BACKEND - QUICKSTART GUIDE

**Status: Ready to deploy**

---

## What You Need

Before starting, have ready:

1. **Azure CLI** installed and authenticated
   ```bash
   az login --tenant de08c407-19b9-427d-9fe8-edf254300ca7
   ```

2. **Azure AD Credentials** (for Copilot Studio integration)
   - Get from Azure Portal → Azure AD → App registrations
   - You need: Client ID, Client Secret

3. **This Repository** cloned locally
   - Path: `/Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure`

---

## Deploy in 3 Commands

### Option A: Automated (Recommended)

**One command does everything:**

```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure
./DEPLOY_ALL.sh
```

**What it does:**
1. Authenticates to Azure
2. Creates App Service Plan
3. Creates App Service
4. Installs dependencies
5. Deploys code
6. Prompts for credentials
7. Tests backend
8. Prints next steps

**Time:** ~15 minutes

---

### Option B: Manual Step-by-Step

**For more control, use these commands in order:**

```bash
# 1. Login to Azure
az login --tenant de08c407-19b9-427d-9fe8-edf254300ca7

# 2. Create App Service Plan (if needed)
az appservice plan create \
  --name MuseAppPlan \
  --resource-group rg-mbgsol-muse-dev \
  --sku B1 \
  --is-linux

# 3. Create App Service
az webapp create \
  --resource-group rg-mbgsol-muse-dev \
  --plan MuseAppPlan \
  --name muse-backend \
  --runtime "NODE:22-lts"

# 4. Go to backend, install dependencies, deploy
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/backend
npm install --omit=dev
az webapp up \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --runtime "NODE:22-lts"

# 5. Set environment variables
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --settings \
    COPILOT_STUDIO_CLIENT_ID="YOUR_CLIENT_ID" \
    COPILOT_STUDIO_CLIENT_SECRET="YOUR_CLIENT_SECRET" \
    COPILOT_STUDIO_TENANT_ID="de08c407-19b9-427d-9fe8-edf254300ca7" \
    NODE_ENV="production"

# 6. Test it
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Time:** ~20 minutes

---

## After Deployment

### Step 1: Verify Backend is Live

```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Expected response:**
```json
{
  "connected": true,
  "timestamp": "2024-09-24T...",
  "connectionStatus": "connected"
}
```

### Step 2: Run Full Test Suite

```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure
./test-backend.sh
```

**Expected output:**
```
✓ All 15 tests passed!
Backend is ready for Copilot Studio integration.
```

### Step 3: Wire to Copilot Studio

**Follow:** `COPILOT_STUDIO_WIRING.md`

1. Open https://copilotstudio.microsoft.com
2. Open your "Muse" agent
3. Add HTTP POST action to `https://muse-backend.azurewebsites.net/api/copilot/chat`
4. Wire to message handler
5. Test in web chat
6. Publish

**Time:** ~15 minutes

### Step 4: Test End-to-End

```bash
# Via web chat in Copilot Studio
# Type: "Hello Muse, who are you?"
# Should see response from backend

# Or via Electron app
# Open Muse app → Chat tab → Send message
```

---

## Troubleshooting

### Deployment Fails

**Error:** `ResourceNotFound - App Service doesn't exist`

**Solution:**
```bash
# Check if plan exists
az appservice plan show --name MuseAppPlan --resource-group rg-mbgsol-muse-dev

# If plan missing, create it
az appservice plan create \
  --name MuseAppPlan \
  --resource-group rg-mbgsol-muse-dev \
  --sku B1 \
  --is-linux

# Then retry deployment
cd backend
az webapp up --resource-group rg-mbgsol-muse-dev --name muse-backend --runtime "NODE:22-lts"
```

### Backend Doesn't Respond

**Error:** `curl: (7) Failed to connect to muse-backend.azurewebsites.net`

**Solution:**
```bash
# Check app service is running
az webapp show --resource-group rg-mbgsol-muse-dev --name muse-backend

# Check logs
az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend

# Restart app
az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend
```

### Getting 401 Unauthorized

**Error:** `{"error": "Unauthorized", "code": 401}`

**Solution:**
```bash
# Credentials not set or incorrect
# Set them again
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --settings \
    COPILOT_STUDIO_CLIENT_ID="correct-id" \
    COPILOT_STUDIO_CLIENT_SECRET="correct-secret" \
    NODE_ENV="production"

# Restart to apply
az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend

# Wait 30 seconds and retry
sleep 30
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

### Tests Fail

**Error:** Tests show red X marks

**Solution:**
```bash
# Check detailed logs
az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend

# Common issues:
# 1. Dependencies not installed: cd backend && npm install --omit=dev
# 2. Port not set: Check environment variables have PORT=8080
# 3. TypeScript not compiled: npm run build in backend/

# Restart and retry
az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure
./test-backend.sh
```

---

## Architecture

```
Muse Electron App (localhost:3000)
           ↓
Backend API (Express.js)
           ↓
Copilot Studio Agent
           ↓
Microsoft Copilot
```

**Backend URL:** `https://muse-backend.azurewebsites.net`

**Key Endpoints:**
- `GET /api/copilot/status` - Health check
- `POST /api/copilot/chat` - Send message, get response
- `POST /api/copilot/chat/stream` - Streaming responses (SSE)
- `POST /api/copilot/auth/login` - Authenticate
- `POST /api/copilot/conversation/new` - Start conversation
- More endpoints in API reference (see below)

---

## Configuration

### Environment Variables

Set on App Service (already done by DEPLOY_ALL.sh):

```
COPILOT_STUDIO_ENDPOINT=https://copilot.microsoft.com/api
COPILOT_STUDIO_CLIENT_ID=<your-azure-ad-app-id>
COPILOT_STUDIO_CLIENT_SECRET=<your-app-password>
COPILOT_STUDIO_TENANT_ID=de08c407-19b9-427d-9fe8-edf254300ca7
NODE_ENV=production
PORT=8080
```

### Resource Group

All resources are in: `rg-mbgsol-muse-dev`

```
- App Service Plan: MuseAppPlan (B1 tier)
- App Service: muse-backend
- Region: East US
```

### Pricing

**Monthly Cost Estimate:**
- App Service Plan (B1): ~$10
- App Service: Included in plan
- **Total: ~$10/month**

---

## Next Steps

After successful deployment:

1. ✅ Backend deployed and tested
2. ⬜ Wire to Copilot Studio (15 min)
3. ⬜ Test end-to-end chat (5 min)
4. ⬜ Configure memory/vault (optional, later)
5. ⬜ Add voice I/O (optional, later)
6. ⬜ Integrate Microsoft 365 (optional, later)

---

## Documentation

| File | Purpose | When to Use |
|------|---------|------------|
| **DEPLOY_ALL.sh** | Automated deployment | First deployment |
| **MANUAL_DEPLOYMENT.md** | Step-by-step CLI guide | If script fails |
| **test-backend.sh** | Endpoint testing | After deployment |
| **COPILOT_STUDIO_WIRING.md** | UI integration guide | Wiring to Copilot Studio |
| **DEPLOYMENT_FINAL.md** | 50-page reference | Detailed troubleshooting |
| **START_HERE.md** | Quick overview | Share with team |

---

## Support

If stuck:

1. Check logs: `az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend`
2. Run tests: `./test-backend.sh`
3. Review error message carefully
4. Check Troubleshooting section above
5. Review detailed docs: `DEPLOYMENT_FINAL.md`

---

## Success Criteria

You're done when:

- ✅ `./test-backend.sh` shows "All tests passed"
- ✅ Copilot Studio agent receives messages from backend
- ✅ Backend sends responses back to Copilot Studio
- ✅ User sees responses in Copilot web chat
- ✅ Electron app can chat with backend

**Estimated total time:** 45 minutes to go live
