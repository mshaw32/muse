# Wire Muse Backend to Copilot Studio

**Status:** Use this guide AFTER the backend is deployed and tested.

---

## Prerequisites

Before starting, you need:

1. ✅ Backend deployed to Azure App Service
   - URL: `https://muse-backend.azurewebsites.net`
   
2. ✅ Backend tested and responding
   - Test: `curl https://muse-backend.azurewebsites.net/api/copilot/status`
   - Expected: `{"connected":true}` or similar success response

3. ✅ Azure AD App Registration credentials
   - Client ID
   - Client Secret
   - Tenant ID: `de08c407-19b9-427d-9fe8-edf254300ca7`

4. ✅ Copilot Studio agent already created
   - Agent name: "Muse"
   - Status: Ready to configure

---

## Step 1: Open Copilot Studio

1. Go to https://copilotstudio.microsoft.com
2. Sign in with your Microsoft account
3. Click **"My Copilots"** (or open your existing Muse copilot)
4. Click on **"Muse"** to open the agent editor

---

## Step 2: Add HTTP Action Tool

1. In the Muse agent editor, go to **"Actions"** tab
2. Click **"+ Add an action"**
3. Select **"Create a new cloud flow"**
4. Or if you want a simpler HTTP action:
   - Click **"+ Add an action"**
   - Select **"Send an HTTP request"**
   - Choose **"Power Automate cloud flow"**

---

## Step 3: Configure HTTP POST to Backend

### Option A: Direct HTTP Action (Simpler)

If using direct HTTP:

1. In the action, configure:
   - **Method:** `POST`
   - **URI:** `https://muse-backend.azurewebsites.net/api/copilot/chat`
   - **Headers:**
     ```
     Content-Type: application/json
     Authorization: Bearer YOUR_TOKEN_HERE
     ```
   - **Body:**
     ```json
     {
       "message": @{triggerBody()?['text']},
       "conversationId": @{triggerBody()?['conversationId']}
     }
     ```

2. Click **"Parse JSON"** on the response
3. Map the response fields to Copilot Studio variables

---

### Option B: Power Automate Cloud Flow (More Control)

1. In Copilot Studio, click **"Create a new cloud flow"**
2. Choose **"Cloud flow"** → **"Automated cloud flow"**
3. Name it: `MuseBackendCall`
4. Trigger: **"When Copilot requests an action"** (or similar)
5. Add action: **"HTTP"**
6. Configure:
   - **Method:** `POST`
   - **URI:** `https://muse-backend.azurewebsites.net/api/copilot/chat`
   - **Headers:**
     ```
     Content-Type: application/json
     ```
   - **Body:**
     ```json
     {
       "message": @{triggerBody()?['question']},
       "conversationId": @{triggerBody()?['conversationId']}
     }
     ```

7. Add action: **"Parse JSON"** with schema:
   ```json
   {
     "type": "object",
     "properties": {
       "response": { "type": "string" },
       "success": { "type": "boolean" }
     }
   }
   ```

8. Click **"Save"**
9. Go back to Copilot Studio
10. In the message handler, add the flow as an action

---

## Step 4: Wire to Message Handler

### In Copilot Studio Agent:

1. Go to **"Topics"** → **"Message"** (or your main conversation topic)
2. In the message handler, add a step:
   ```
   Copilot: [Call MuseBackendCall cloud flow]
   Send response: @{outputs('Parse_JSON')?['body']?['response']}
   ```

3. Or if using Copilot Studio variables:
   ```
   Copilot says: @{outputs('HTTP')?['body']?['response']}
   ```

---

## Step 5: Set Environment Variables (If Not Done)

If the backend needs credentials, set them on App Service:

```bash
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --settings \
    COPILOT_STUDIO_CLIENT_ID="your-client-id" \
    COPILOT_STUDIO_CLIENT_SECRET="your-client-secret" \
    COPILOT_STUDIO_TENANT_ID="de08c407-19b9-427d-9fe8-edf254300ca7" \
    NODE_ENV="production"
```

---

## Step 6: Test the Backend Endpoint

Before publishing, test the endpoint manually:

```bash
# Test status
curl https://muse-backend.azurewebsites.net/api/copilot/status

# Expected response:
# {"connected":true,"timestamp":"2024-09-24T..."}

# Test chat endpoint
curl -X POST https://muse-backend.azurewebsites.net/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello Muse",
    "conversationId": "test-123"
  }'

# Expected response (or 401 if auth needed):
# {"response":"Hello! I am Muse...","success":true}
```

If you get `401 Unauthorized`, the backend is running but needs auth. Make sure credentials are set.

---

## Step 7: Publish the Agent

1. In Copilot Studio, click **"Publish"** (top right)
2. Choose your publishing channel:
   - **Web Chat:** For web-based testing
   - **Microsoft Teams:** To use in Teams
   - **Custom app:** For the Electron frontend
3. Click **"Publish"**

---

## Step 8: Test End-to-End

### Via Web Chat:
1. In Copilot Studio, click **"Web Chat"** (bottom right)
2. Type: "Hello Muse, who are you?"
3. Watch the response come from your backend
4. Verify it's not a mock response

### Via Electron App:
1. Open the Muse Electron app
2. Click **"Chat"**
3. Type a message
4. Verify response comes from live backend

---

## Troubleshooting

### Backend Returns 401 Unauthorized
- Check environment variables are set correctly
- Verify Client ID and Secret in Azure AD
- Run: `az webapp config appsettings list --resource-group rg-mbgsol-muse-dev --name muse-backend`

### Copilot Studio Can't Reach Backend
- Test: `curl https://muse-backend.azurewebsites.net/api/copilot/status`
- Check App Service is running: `az webapp show --resource-group rg-mbgsol-muse-dev --name muse-backend`
- Check firewall rules (if any)

### No Response from Copilot
- Check Copilot Studio action configuration
- Check Power Automate flow execution logs
- Look at backend logs: `az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend`

### Response is Mock Data
- Backend is running in mock mode (credentials not set)
- Set real credentials in App Service environment variables
- Restart the app: `az webapp restart --resource-group rg-mbgsol-muse-dev --name muse-backend`

---

## Next Steps

After successfully wiring:
1. ✅ Verify basic chat works
2. ✅ Test with memory/vault context (if implemented)
3. ✅ Configure audio input/output (Electron app)
4. ✅ Add Microsoft 365 actions (Teams, Outlook, etc.)
5. ✅ Deploy to Teams as a published app

---

## Backend API Reference

### POST /api/copilot/chat
Send a message to Muse, get response.

**Request:**
```json
{
  "message": "string (user message)",
  "conversationId": "string (optional, for context)",
  "userId": "string (optional)"
}
```

**Response:**
```json
{
  "response": "string (Muse's response)",
  "success": true,
  "timestamp": "ISO-8601 timestamp"
}
```

---

### GET /api/copilot/status
Check if backend is alive and connected.

**Response:**
```json
{
  "connected": true,
  "timestamp": "ISO-8601 timestamp",
  "uptime": "seconds"
}
```

---

### GET /api/copilot/health
Detailed health check.

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

## Support

If you get stuck:
1. Check backend logs: `az webapp log tail --resource-group rg-mbgsol-muse-dev --name muse-backend`
2. Verify Azure AD credentials
3. Check Copilot Studio error messages
4. Review Power Automate flow execution logs
