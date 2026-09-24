# Corporate Proxy / SSL Certificate Troubleshooting Guide

## Problem
```
HTTPSConnectionPool(host='muse-backend.scm.azurewebsites.net', port=443): 
Max retries exceeded with url: /api/zipdeploy?isAsync=true
Caused by SSLError(SSLCertificationError(...))
```

**Root Cause:** Corporate proxy or firewall is intercepting HTTPS traffic with a self-signed certificate.

---

## Solution 1: Disable SSL Verification (Recommended - Corporate Environment)

### Option 1A: Environment Variables (Temporary)
```bash
export AZURE_CLI_DISABLE_CONNECTION_VERIFY=1
export PYTHONWARNINGS=ignore:Unverified\ HTTPS\ request
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Then run deployment
cd backend
npm install --omit=dev
az webapp up \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --runtime "NODE:22-lts"
```

### Option 1B: Script (Provided)
```bash
./fix-and-retry-deploy.sh
```

### Option 1C: Global Azure CLI Config (Persistent)
```bash
az config set core.no_color=false
az config set core.check_latest=false
az config set defaults.group=rg-mbgsol-muse-dev

# Add to ~/.azure/config:
[cloud]
disableverificationwarning = true
```

---

## Solution 2: Add Corporate Certificate to Node/Python

If your corporate proxy provides a .cer certificate:

```bash
# For Node.js
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem

# For Python (used by Azure CLI)
export REQUESTS_CA_BUNDLE=/path/to/corporate-ca.pem
export CURL_CA_BUNDLE=/path/to/corporate-ca.pem

cd backend
npm install --omit=dev
az webapp up \
  --resource-group rg-mbgsol-muse-dev \
  --name muse-backend \
  --runtime "NODE:22-lts"
```

**Get corporate certificate:** Contact your IT/Cognizant security team for the root CA certificate.

---

## Solution 3: Alternative Deployment via Azure Portal

If CLI deployment continues to fail:

### Step 1: Build Locally
```bash
cd backend
npm install
npm run build
```

### Step 2: Zip the Dist Folder
```bash
cd backend
zip -r ../muse-backend.zip dist node_modules
```

### Step 3: Upload via Portal
1. Go to Azure Portal → muse-backend App Service
2. Deployment Center → Manual Deployment
3. Upload muse-backend.zip
4. App Service will extract and start

### Step 4: Configure App Settings
```
NODE_ENV=production
COPILOT_CLIENT_ID=<your-client-id>
COPILOT_CLIENT_SECRET=<your-client-secret>
COPILOT_TENANT_ID=<your-tenant-id>
```

---

## Solution 4: Use Docker Image (If Corporate Network Allows)

Create a Docker image locally and push to ACR:

```bash
cd backend
docker build -t muse-backend:latest .
docker tag muse-backend:latest <acrname>.azurecr.io/muse-backend:latest
docker push <acrname>.azurecr.io/muse-backend:latest

# Then deploy from ACR to App Service
```

---

## Verification After Deployment

Regardless of method, verify deployment succeeded:

```bash
# Check if app is running
curl https://muse-backend.azurewebsites.net/api/copilot/status

# Should return:
# {"status":"ok","timestamp":"2024-09-24T..."}
```

---

## If All Else Fails: Manual Troubleshooting

### Check Azure CLI Connection
```bash
az account show
az group show --name rg-mbgsol-muse-dev
az webapp show --name muse-backend --resource-group rg-mbgsol-muse-dev
```

### Check App Service Logs
```bash
az webapp log tail --name muse-backend --resource-group rg-mbgsol-muse-dev --follow
```

### Check Deployment Status
```bash
az webapp deployment slot list --name muse-backend --resource-group rg-mbgsol-muse-dev
```

### Full Deployment History
```bash
az webapp deployment list --name muse-backend --resource-group rg-mbgsol-muse-dev --query '[].{id:id, status:status, author:author, message:message}'
```

---

## Contact Cognizant Security Team If:

- You don't have corporate CA certificate
- Your proxy requires authentication
- SSH/VPN tunnel needed to reach Azure
- Different proxy configuration needed

**Typical Response:** 24-48 hours for certificate + updated proxy settings.

**Workaround While Waiting:** Use Azure Portal manual deployment (Solution 3).

---

## Quick Decision Tree

```
SSL Certificate Error?
├─ Yes, I can get corporate CA certificate
│  └─ Use Solution 2 (Add to NODE_EXTRA_CA_CERTS)
├─ No, IT is slow
│  └─ Use Solution 3 (Azure Portal manual upload)
├─ Prefer one-command fix
│  └─ Use Solution 1B (./fix-and-retry-deploy.sh)
└─ Want to try CLI again
   └─ Use Solution 1A (export env vars + retry)
```

---

## Expected Behavior After Fix

```
Starting zip deployment. This operation can take a while to complete ...
Kudu deployment service is initiating the build process ...
[...]
App Service 'muse-backend' is successfully created and will be deployed
```

Once you see this, app is deploying. Takes ~3-5 minutes to fully start.

**Next:** Run `./post-deploy-verify.sh`

