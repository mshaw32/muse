# 🚀 MUSE BACKEND - DEPLOYMENT & VERIFICATION GUIDE

**Status:** Deployment package ready for Azure Portal upload

---

## 📋 Quick Start (5 Minutes)

### Step 1: Upload to Azure Portal

```bash
# The deployment zip is ready:
muse-backend-deploy.zip (26 KB)
```

**Instructions:**
1. Go to: https://portal.azure.com
2. Search: "muse-backend" (App Service)
3. Click: **Deployment → Deployment center**
4. Select: **Upload zip file**
5. Choose: `muse-backend-deploy.zip`
6. Click: **Deploy**
7. Wait: 5-10 minutes

**Detailed guide:** See `AZURE_PORTAL_DEPLOYMENT_GUIDE.md`

---

## 🔍 Verification After Upload

Once deployment shows "Successful" in Azure Portal:

### Option A: Run Master Orchestrator (RECOMMENDED)

```bash
chmod +x deploy-master.sh
./deploy-master.sh
```

**What it does:**
- Waits for backend to be ready
- Runs health check
- Runs comprehensive E2E tests
- Offers interactive Copilot Studio wiring
- Provides summary and next steps

**Time:** ~5 minutes

### Option B: Manual Step-by-Step

**1. Quick health check (2 min):**
```bash
curl -s https://muse-backend.azurewebsites.net/api/copilot/status | jq .
```

**Expected:**
```json
{
  "connected": true,
  "connectionStatus": "connected",
  "timestamp": "2024-09-24T..."
}
```

**2. Run verification suite (3 min):**
```bash
chmod +x verify-deployment.sh
./verify-deployment.sh
```

**3. Run comprehensive E2E tests (5 min):**
```bash
chmod +x e2e-verify.sh
./e2e-verify.sh
```

**Expected:** ✅ 21/21 endpoints passing

---

## 🔌 Wiring to Copilot Studio

### Option A: Interactive Guide (RECOMMENDED)

```bash
chmod +x copilot-wiring-helper.sh
./copilot-wiring-helper.sh
```

**What it does:**
- Step-by-step prompts
- Shows exactly what to do in Copilot Studio UI
- Takes ~15 minutes

### Option B: Manual UI Configuration

**File:** `COPILOT_STUDIO_WIRING.md` (in repo root)

**Quick summary:**
1. Go to: https://copilotstudio.microsoft.com
2. Open your Muse agent
3. Create topic: "Chat with Muse"
4. Add HTTP POST action:
   - URL: `https://muse-backend.azurewebsites.net/api/copilot/chat`
   - Method: POST
   - Body: `{ "message": "{user.message}", "conversationId": "{conv.id}", "userId": "{user.id}", "includeContext": true }`
5. Add response display
6. Publish agent

---

## ✅ Testing End-to-End

### Test 1: Copilot Studio Web Chat

1. Go to Copilot Studio agent
2. Click **Test** or **Preview**
3. Type: "Hello Muse"
4. Wait for response from backend (2-3 seconds)
5. Verify response appears in chat

### Test 2: Electron App (if configured)

1. Start Electron app
2. Type: "Hello Muse"
3. Should get same response as web chat

### Test 3: View Backend Logs

```bash
az webapp log tail \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend
```

**Look for:**
- "Received message from Copilot Studio"
- "Sent response to Copilot"
- No ERROR lines

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Deployment stuck in Portal** | Check: App Service → Deployments tab → View logs |
| **Backend returns 404** | App Service doesn't exist or not deployed yet |
| **Backend returns 503** | Still starting (Azure startup can take 3-5 min), wait and retry |
| **No response from backend** | Check Copilot Studio OAuth credentials are configured |
| **Connection timeout** | Check firewall: Azure may need to whitelist your IP |
| **Copilot Studio shows error** | Check HTTP action URL is exact: `https://muse-backend.azurewebsites.net/api/copilot/chat` |

**For advanced troubleshooting:**
See `CORPORATE_PROXY_TROUBLESHOOTING.md`

---

## 📁 File Reference

### Deployment Files
- **`muse-backend-deploy.zip`** - Ready to upload to Portal
- **`deploy-via-portal.sh`** - Creates the zip (already done)
- **`deploy-master.sh`** - Orchestrates entire deployment + verification
- **`AZURE_PORTAL_DEPLOYMENT_GUIDE.md`** - Step-by-step Portal instructions

### Verification Files
- **`verify-deployment.sh`** - Waits for backend, runs health checks
- **`post-deploy-verify.sh`** - Quick backend health tests
- **`e2e-verify.sh`** - Comprehensive 21-endpoint test suite
- **`test-backend.sh`** - Original test suite

### Copilot Studio Wiring
- **`copilot-wiring-helper.sh`** - Interactive wiring guide
- **`COPILOT_STUDIO_WIRING.md`** - Manual UI step-by-step
- **`copilot-wiring-helper.sh`** - Alternative wiring automation

### Documentation
- **`POST_DEPLOYMENT_CHECKLIST.md`** - 8-step verification checklist
- **`DEPLOYMENT_README.md`** - Master deployment reference
- **`CORPORATE_PROXY_TROUBLESHOOTING.md`** - Advanced proxy issues
- **`QUICKSTART.md`** - 5-minute quick start

---

## 🎯 Success Criteria

All 8 must be TRUE for production use:

- [ ] Backend deployed to `muse-backend.azurewebsites.net`
- [ ] `curl /api/copilot/status` returns HTTP 200
- [ ] `verify-deployment.sh` shows all tests passing
- [ ] `e2e-verify.sh` shows all 21 endpoints passing
- [ ] Copilot Studio agent wired to backend
- [ ] Agent publishes successfully
- [ ] Web chat message returns response from backend
- [ ] Electron app message returns response from backend

---

## 📊 Timeline

```
Portal upload:           5-10 min
Backend startup:         3-5 min  (included in above)
Verification:            5 min
Copilot wiring:          15 min
End-to-end testing:      5 min
────────────────────────────────
TOTAL:                   35-45 min
```

---

## 🚀 Next Steps

1. **Upload to Portal** (see Quick Start above)
2. **Wait for deployment** to show "Successful"
3. **Run verification:**
   ```bash
   ./deploy-master.sh
   ```
4. **Wire Copilot Studio:**
   ```bash
   ./copilot-wiring-helper.sh
   ```
5. **Test end-to-end** in web chat + Electron app
6. **Go live!** 🎉

---

## 📞 Need Help?

1. **During deployment:** Check Azure Portal Deployments tab for logs
2. **After deployment:** Run `az webapp log tail ...` to view live logs
3. **Proxy issues:** See `CORPORATE_PROXY_TROUBLESHOOTING.md`
4. **Copilot wiring:** Use `copilot-wiring-helper.sh` for interactive guide

---

## 🔑 Key URLs & Credentials

| Item | Value |
|------|-------|
| Azure Portal | https://portal.azure.com |
| Copilot Studio | https://copilotstudio.microsoft.com |
| Backend API | https://muse-backend.azurewebsites.net |
| Resource Group | `rg-mbgsol-muse-dev` |
| App Service | `muse-backend` |
| Region | East US |

---

**Status:** ✅ Ready to deploy

**Next command:**
```bash
# Go to Azure Portal and upload: muse-backend-deploy.zip
# Then run:
./deploy-master.sh
```
