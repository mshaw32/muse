# POST-DEPLOYMENT CHECKLIST

Run this after deployment completes.

---

## Step 1: Wait for App Service to Start

**Time: 2-3 minutes**

After deployment shows "Success", the app needs time to start.

```bash
# Wait before testing
sleep 120
```

---

## Step 2: Verify Backend Health

**Command:**
```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

**Expected response:**
```json
{
  "connected": true,
  "connectionStatus": "connected"
}
```

**If you get:**
- `Connection refused` → App still starting, wait 1-2 minutes
- `404 Not Found` → App Service not found, check deployment
- `403 Forbidden` → Check if app is running in portal
- `SSL: CERTIFICATE_VERIFY_FAILED` → Corporate proxy, use: `curl -k https://...`

**✅ If you see `"connected": true`, move to Step 3**

---

## Step 3: Run Automated Verification Suite

**Time: 3-5 minutes**

```bash
./post-deploy-verify.sh
```

This will:
- Poll backend every 5 seconds (max 10 attempts)
- Test all critical endpoints
- Show pass/fail for each test

**Expected output:**
```
✓ Health check passed
✓ Chat endpoint working
✓ Status endpoint working
[...]
All verifications passed!
```

**✅ If all tests pass, move to Step 4**

---

## Step 4: Run Comprehensive E2E Tests

**Time: 2-3 minutes**

```bash
./e2e-verify.sh
```

This will test all 21 endpoints across 5 phases:
- Phase 1: Core (status)
- Phase 2: Conversations
- Phase 3: Auth
- Phase 4: Retrieval (data)
- Phase 5: Operations

**Expected output:**
```
PHASE 1: Core Endpoints
  GET /api/copilot/status: ✓ PASS
[...]
FINAL SUMMARY
  Total Tests: 21
  Passed: 21
  Failed: 0
```

**✅ If all 21 tests pass, move to Step 5**

---

## Step 5: Verify Environment Variables

In Azure Portal:
1. Go to muse-backend App Service
2. Settings → Configuration → Application Settings
3. Verify these are set:
   - ✅ NODE_ENV = production
   - ✅ COPILOT_STUDIO_CLIENT_ID = [not blank]
   - ✅ COPILOT_STUDIO_CLIENT_SECRET = [not blank]
   - ✅ COPILOT_STUDIO_TENANT_ID = de08c407-19b9-427d-9fe8-edf254300ca7

**✅ If all variables are set, move to Step 6**

---

## Step 6: Wire to Copilot Studio

**Time: 15 minutes**

Run the wiring helper:
```bash
./copilot-wiring-helper.sh
```

Then follow these steps manually:
1. Go to Copilot Studio: https://copilotstudio.microsoft.com
2. Open your Muse agent
3. Click "Add tool" or "Edit"
4. Select "Call an HTTP request"
5. Configure:
   - **URL:** `https://muse-backend.azurewebsites.net/api/copilot/chat`
   - **Method:** POST
   - **Headers:** `Content-Type: application/json`
   - **Body:**
     ```json
     {
       "prompt": "<user input>",
       "conversationId": "<conversation id>"
     }
     ```
6. Test the connection
7. Save
8. Publish the agent

**Reference:** See COPILOT_STUDIO_WIRING.md for detailed UI steps

**✅ If wiring succeeds, move to Step 7**

---

## Step 7: Test in Copilot Studio Web Chat

**Time: 2-3 minutes**

1. Go to Copilot Studio: https://copilotstudio.microsoft.com
2. Find your Muse agent
3. Click "Test" or "Chat"
4. Send a test message: "Hello, are you working?"
5. Verify you get a response from the backend

**Expected:**
- Message sent
- Response received from Muse backend
- No error messages

**✅ If you get a response, move to Step 8**

---

## Step 8: Test in Electron App

**Time: 2-3 minutes**

1. Launch the Electron app
2. Send a test message
3. Verify you get a response
4. Check that response comes from Copilot Studio (not mock)

**Expected:**
- Message sends successfully
- Response appears in chat
- Shows actual data (not mock)

**✅ If Electron app works, you're done!**

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Connection refused` | App still starting, wait 2-3 minutes |
| `404 Not Found` | Check app service exists in portal |
| `403 Forbidden` | Check app is running (portal → Overview → Start) |
| `SSL cert error` | Use curl -k or check proxy settings |
| Tests timeout | Backend still starting, wait and retry |
| Auth fails | Check CLIENT_ID/SECRET in app settings |
| Copilot Studio no response | Check HTTP wiring, verify URL is correct |
| Electron app blank | Check backend URL is https:// not http:// |

---

## Final Verification

All steps passed? 🎉

```
✅ Backend deployed
✅ All 21 endpoints verified
✅ Environment variables set
✅ Wired to Copilot Studio
✅ Web chat working
✅ Electron app working
```

**Status: PRODUCTION READY** 🚀

---

## Rollback (If Needed)

If something goes wrong:

```bash
# Delete deployment
az webapp deployment slot delete \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --slot staging

# Or delete entire app service
az webapp delete \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend
```

Then redeploy.

---

**Total time from deployment start to live: 40-50 minutes**

