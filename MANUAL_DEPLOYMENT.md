# MANUAL DEPLOYMENT - Step by Step

Run these commands ONE AT A TIME in your terminal. Copy-paste each block.

---

## STEP 1: Authenticate to Azure
```bash
az login --tenant de08c407-19b9-427d-9fe8-edf254300ca7
```
Follow the prompts. You'll be taken to a browser to sign in.

---

## STEP 2: Create App Service Plan
```bash
az appservice plan create \
  --name MuseAppPlan \
  --resource-group rg-mbgsol-muse-dev \
  --sku B1 \
  --is-linux
```

Wait for it to complete. Should take 1-2 minutes.

---

## STEP 3: Create App Service
```bash
az webapp create \
  --resource-group rg-mbgsol-muse-dev \
  --plan MuseAppPlan \
  --name muse-backend \
  --runtime "NODE|18-lts"
```

Wait for it to complete. Should take 2-3 minutes.

---

## STEP 4: Get Your App Service URL
```bash
az webapp show \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --query "defaultHostName" -o tsv
```

**COPY THE OUTPUT** - it will look like: `muse-backend.azurewebsites.net`

You'll need this for Copilot Studio.

---

## STEP 5: Deploy Your Code
```bash
cd /Users/948471/Projects/copilot-worktrees/muse/mshaw32-upgraded-adventure/backend

npm install --omit=dev

cd ..

az webapp up \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --src-dir backend \
  --runtime "NODE|18-lts"
```

Wait for it to complete. Should take 3-5 minutes.

---

## STEP 6: Set Environment Variables

Replace these with YOUR actual values:
- `YOUR_CLIENT_ID` = Azure AD app registration client ID
- `YOUR_CLIENT_SECRET` = Azure AD app registration secret

```bash
az webapp config appsettings set \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --settings \
    COPILOT_STUDIO_ENDPOINT="https://copilot.microsoft.com/api" \
    COPILOT_STUDIO_CLIENT_ID="YOUR_CLIENT_ID" \
    COPILOT_STUDIO_CLIENT_SECRET="YOUR_CLIENT_SECRET" \
    COPILOT_STUDIO_TENANT_ID="de08c407-19b9-427d-9fe8-edf254300ca7" \
    NODE_ENV="production" \
    PORT="8080"
```

---

## STEP 7: Test the Backend

Replace `muse-backend.azurewebsites.net` with your actual App Service URL from Step 4:

```bash
curl https://muse-backend.azurewebsites.net/api/copilot/status
```

Should return something like: `{"connected":true}`

---

## STEP 8: Wire to Copilot Studio

Go to https://copilotstudio.microsoft.com

1. Open your Muse agent
2. Click **"Add tool"**
3. Select **"Call an HTTP request"** or **"Custom API"**
4. URL: `https://muse-backend.azurewebsites.net/api/copilot/chat`
5. Method: `POST`
6. Headers: `Content-Type: application/json`
7. Body:
```json
{
  "prompt": "",
  "conversationId": ""
}
```
8. Save and test
9. Publish

---

**That's it! Muse is live.**

If you get stuck on any step, send me the error and I'll help fix it.

