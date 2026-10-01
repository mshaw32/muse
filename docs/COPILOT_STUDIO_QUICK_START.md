# Quick Start - Copilot Studio Integration (15 minutes overview)

**For the impatient:** Here's the TL;DR checklist

---

## Pre-Flight Checklist (2 minutes)

```
☐ Backend v5 is deployed and responding
  curl https://muse-backend.azurewebsites.net/
  
☐ You have Azure AD credentials:
  - Client ID
  - Client Secret
  - Tenant ID: de08c407-19b9-427d-9fe8-edf254300ca7
  
☐ You have a Muse agent in Copilot Studio
  https://copilotstudio.microsoft.com
```

---

## 5 Steps to Wire Backend (10 minutes)

### 1️⃣ Set Credentials in Azure App Service (2 min)

```bash
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --settings \
    COPILOT_STUDIO_CLIENT_ID="YOUR-CLIENT-ID" \
    COPILOT_STUDIO_CLIENT_SECRET="YOUR-SECRET" \
    COPILOT_STUDIO_TENANT_ID="de08c407-19b9-427d-9fe8-edf254300ca7" \
    NODE_ENV="production"

# Restart the app
az webapp restart \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend
```

### 2️⃣ Create Power Automate Flow (3 min)

Go to https://flow.microsoft.com

1. Click: **+ Create**
2. Select: **Automated cloud flow**
3. Name: `MuseBackendChat`
4. Trigger: **When Copilot requests an action**
5. Click: **Create**

### 3️⃣ Add HTTP Action to Backend (2 min)

In Power Automate:

1. Click: **+ New step**
2. Add: **HTTP** action
3. Configure:
   ```
   Method: POST
   URI: https://muse-backend.azurewebsites.net/api/copilot/chat
   Body: {
     "message": @{triggerBody()?['text']},
     "conversationId": @{triggerBody()?['conversationId']}
   }
   ```
4. Click: **+ New step**
5. Add: **Parse JSON** action
6. Select **Body** from HTTP action

### 4️⃣ Wire Flow to Copilot Studio Agent (2 min)

Go back to https://copilotstudio.microsoft.com

1. Open: **Muse** agent
2. Click: **Topics**
3. Click: **Message** (or main conversation topic)
4. Add step: **Call MuseBackendChat** flow
5. Add response: 
   ```
   @{outputs('Call_MuseBackendChat')?['body']?['response']}
   ```
6. Click: **Save**

### 5️⃣ Publish & Test (1 min)

1. Click: **Publish** (top right)
2. Choose: **Web Chat**
3. Click: **Publish**
4. Open: **Web Chat**
5. Type: "Hello Muse"
6. ✅ Should see response from backend

---

## Verification (3 minutes)

**All 3 tests should pass:**

```bash
# Test 1: Backend is alive
curl https://muse-backend.azurewebsites.net/
# Expected: JSON with service info

# Test 2: Chat endpoint works
curl -X POST https://muse-backend.azurewebsites.net/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Muse","conversationId":"test"}'
# Expected: Response from Muse

# Test 3: Web Chat responds
# Go to Copilot Studio Web Chat
# Type a message
# Expected: Response (not instant, should take 1-2 seconds)
```

---

## If Something Breaks

### Backend Not Responding
```bash
# Check status
az webapp show --resource-group rg-mbgsol-muse-dev --name muse-backend | grep state

# Check logs
az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend
```

### Flow Can't Connect
- Check URL is exactly: `https://muse-backend.azurewebsites.net/api/copilot/chat`
- Check method is: `POST`
- Check body JSON is valid

### Copilot Doesn't Respond
- Go to https://flow.microsoft.com
- Find **MuseBackendChat** flow
- Click: **Run history**
- Look for failed runs and error messages

### Getting 401 Error
- Credentials in App Service might be wrong
- Restart app: `az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend`
- Wait 30 seconds, try again

---

## Success = You're Done!

When you can:
1. ✅ Type message in Web Chat
2. ✅ Get response from Muse (not instant, 1-2 seconds)
3. ✅ Ask multiple questions
4. ✅ See conversation context matters

**Then your backend is successfully wired to Copilot Studio!**

---

## Next: Phase 2 Features

Now that basic integration works:
1. Add conversation history
2. Add vault context
3. Engineer personality prompt
4. Test memory-augmented responses

See: `PHASE-2-COPILOT-BUILD-SPEC.md`

---

## Full Details?

Read: `COPILOT_STUDIO_SETUP_COMPLETE.md` for comprehensive guide with:
- Troubleshooting
- Architecture diagram
- API reference
- All quick commands

---

**Estimated Total Time:** 15 minutes setup + testing

**Backend Status:** ✅ LIVE (https://muse-backend.azurewebsites.net/)

**Next:** Follow the 5 steps above

🚀 **Go wire it up!**
