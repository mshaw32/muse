# MUSE Copilot Studio Agent Creation Script (PowerShell)
# Requires: Power Platform CLI (pac)
# Install: https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction

param(
    [Parameter(Mandatory=$true)]
    [string]$EnvironmentId,
    
    [Parameter(Mandatory=$true)]
    [string]$AppServiceUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$ClientId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TenantId = ""
)

Write-Host "=== MUSE Copilot Studio Agent Creation ===" -ForegroundColor Green
Write-Host ""

# Check if pac CLI is installed
$pacPath = Get-Command pac -ErrorAction SilentlyContinue
if (-not $pacPath) {
    Write-Host "ERROR: Power Platform CLI (pac) not found. Install from:" -ForegroundColor Red
    Write-Host "  https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction"
    exit 1
}

# Authenticate to Power Platform
Write-Host "Authenticating to Power Platform..." -ForegroundColor Yellow
pac auth create -env $EnvironmentId

# Create Copilot agent
Write-Host "Creating Copilot Studio agent..." -ForegroundColor Yellow

$agentDefinition = @{
    name = "Muse"
    description = "Personal AI assistant integrated with Microsoft 365"
    systemPrompt = @"
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
"@
    kind = "Agent"
} | ConvertTo-Json

Write-Host "Agent definition:" -ForegroundColor Cyan
Write-Host $agentDefinition

# Create connector to backend
Write-Host ""
Write-Host "Creating OAuth2 connector to backend..." -ForegroundColor Yellow

$connectorDefinition = @{
    name = "MuseBackend"
    type = "OAuth2"
    oauth2Config = @{
        tokenUrl = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
        clientId = $ClientId
        resource = $AppServiceUrl
        scopes = @("$AppServiceUrl/.default")
    }
} | ConvertTo-Json

Write-Host "Connector definition created"
Write-Host ""

Write-Host "IMPORTANT: Complete these steps manually in Copilot Studio UI:" -ForegroundColor Yellow
Write-Host "  1. Go to https://copilotstudio.microsoft.com"
Write-Host "  2. Navigate to your environment"
Write-Host "  3. Create new Agent > Name: 'Muse'"
Write-Host "  4. Add system prompt (see above)"
Write-Host "  5. Create new connector:"
Write-Host "     Type: OAuth2 (OIDC)"
Write-Host "     Client ID: $ClientId"
Write-Host "     Tenant ID: $TenantId"
Write-Host "     Token Endpoint: https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
Write-Host "     Scope: $AppServiceUrl/.default"
Write-Host "  6. Add action 'Send Message':"
Write-Host "     Method: POST"
Write-Host "     URL: $AppServiceUrl/api/copilot/chat"
Write-Host "     Authentication: Use connector above"
Write-Host "     Body:"
Write-Host "       { ""prompt"": ""<user message>"", ""conversationId"": ""<conversation_id>"" }"
Write-Host "  7. Test the agent chat"
Write-Host "  8. Click 'Publish'"
Write-Host ""
Write-Host "Then run CLI deployment:" -ForegroundColor Cyan
Write-Host "  pac solution publish -p MuseAgent"
Write-Host ""

Write-Host "Setup complete!" -ForegroundColor Green
