# PHASE 2 IMPLEMENTATION GUIDE
## Streaming Responses & Memory-Augmented Chat

---

## ✅ PHASE 1 STATUS: COMPLETE

**What was delivered:**
- ✅ Backend deployed to Azure App Service
- ✅ Express server running and responding
- ✅ All routes registered (`/api/copilot/status`, `/api/copilot/auth/login`, etc.)
- ✅ Mock authentication system in place
- ✅ Verified with curl: `https://muse-backend.azurewebsites.net/api/copilot/status`

**What Phase 1 provided:**
- Foundation: Working backend with authentication scaffolding
- Testing capability: Mock endpoints you can call from frontend
- Deployment path: Proven Azure deployment process
- Ready for: Phase 2 development (streaming responses)

---

## PHASE 2 OVERVIEW

**Goal:** Enable real-time streaming responses from Copilot with memory context

**What you'll build:**
1. SSE (Server-Sent Events) streaming endpoint
2. Memory vault integration (read .md files from vault folder)
3. Context-augmented responses (inject memory into chat)
4. End-to-end test: Send question → Get streamed response with memory

**Estimated scope:** 2-3 days of focused work

---

## PHASE 2 IMPLEMENTATION STATUS

✅ Implemented in current backend architecture:
- `POST /api/copilot/chat/stream` SSE route is active in `backend/src/routes/copilot.ts`
- Memory context is now injected into streaming prompts via:
  - `getRuntime().memory.search(...)`
  - `getRuntime().memory.searchVault(...)`
  - combined as `memoryContext` for chat streaming
- `CopilotChatService.streamResponse(...)` and `sendPrompt(...)` now accept optional `memoryContext`
- Project builds successfully after these changes

⚠️ Important: this repo does **not** use `backend/src/adapters/CopilotStudioAdapter.ts`.
The active streaming implementation is in:
- `backend/src/services/copilot/CopilotChatService.ts`
- `backend/src/routes/copilot.ts`

---

## PHASE 2 STEP-BY-STEP IMPLEMENTATION (Reference)

### PART 1: Set Up Memory Vault Reader (2 hours)

**Run this work from:** `backend/`

**Vault location:** repo-root `vault/` folder
(`.../mshaw32-upgraded-adventure/vault/*.md`)

#### Step 1.1: Create Memory Service
**File:** `backend/src/services/memory/MemoryVaultService.ts`

> NOTE: In the current branch, memory context is wired through
> `getRuntime().memory.search(...)` and `getRuntime().memory.searchVault(...)`
> in `backend/src/routes/copilot.ts`. You can still introduce
> `MemoryVaultService.ts` later if you want a dedicated abstraction layer.

**What it does:**
- Reads .md files from your vault folder
- Parses obsidian-style frontmatter
- Returns relevant memories based on keyword search

**Code to implement:**
```typescript
import fs from 'fs';
import path from 'path';

export class MemoryVaultService {
  private vaultPath: string;

  constructor(vaultPath: string = '../vault') {
    this.vaultPath = path.resolve(__dirname, vaultPath);
  }

  // Read all .md files from vault
  async loadAllMemories(): Promise<Map<string, string>> {
    const memories = new Map<string, string>();
    const files = fs.readdirSync(this.vaultPath);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(this.vaultPath, file), 'utf-8');
        memories.set(file, content);
      }
    }
    
    return memories;
  }

  // Find relevant memories by keyword
  async findRelevantMemories(query: string, topN: number = 5): Promise<string[]> {
    const allMemories = await this.loadAllMemories();
    const memories = Array.from(allMemories.values());
    
    // Simple keyword matching - can be upgraded to semantic search later
    const relevant = memories
      .filter(m => m.toLowerCase().includes(query.toLowerCase()))
      .slice(0, topN);
    
    return relevant;
  }

  // Build context string for LLM
  async buildMemoryContext(query: string): Promise<string> {
    const relevant = await this.findRelevantMemories(query);
    
    if (relevant.length === 0) {
      return 'No relevant memories found.';
    }
    
    return `## Relevant Context from Memory\n\n${relevant.join('\n\n---\n\n')}`;
  }
}
```

**Testing locally:**
```bash
cd backend
npx ts-node -e "
  import { MemoryVaultService } from './src/services/memory/MemoryVaultService';
  const vault = new MemoryVaultService();
  vault.loadAllMemories().then(m => console.log('Loaded memories:', m.size));
"
```

**Expected output:** `Loaded memories: <number of .md files in your vault>`

---

### PART 2: Wire Streaming Endpoint (3 hours)

#### Step 2.1: Create StreamResponse Method in CopilotStudioAdapter
**File:** `backend/src/adapters/CopilotStudioAdapter.ts`

> NOTE: This path is from an older design. In this repository, use
> `backend/src/services/copilot/CopilotChatService.ts` instead.

**Add this method to the class:**
```typescript
async streamResponse(
  userMessage: string,
  conversationId: string,
  memoryContext: string
): Promise<AsyncIterableIterator<string>> {
  // In Phase 1: return mock streamed response
  // In Phase 4: integrate with real Copilot Studio API
  
  const fullPrompt = `
    User Question: ${userMessage}
    
    ${memoryContext}
    
    Please provide a helpful response.
  `;
  
  return this.mockStreamResponse(fullPrompt);
}

private async *mockStreamResponse(prompt: string): AsyncIterableIterator<string> {
  // Simulate streaming by yielding chunks
  const response = `I received your question: "${prompt.substring(0, 50)}..."
    
Based on the context provided, here's my response:

This is a streamed response that simulates real Copilot responses. `;
  
  for (let i = 0; i < response.length; i += 10) {
    yield response.substring(i, i + 10);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
  }
}
```

#### Step 2.2: Create Streaming Endpoint
**File:** `backend/src/routes/copilot.ts`

**Add this POST route:**
```typescript
import { Router, Request, Response } from 'express';
import { CopilotStudioAdapter } from '../adapters/CopilotStudioAdapter';
import { MemoryVaultService } from '../services/memory/MemoryVaultService';

const router = Router();
const copilotAdapter = new CopilotStudioAdapter();
const memoryVault = new MemoryVaultService();

// POST /api/copilot/chat/stream - SSE Streaming endpoint
router.post('/chat/stream', async (req: Request, res: Response) => {
  try {
    const { message, conversationId = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Load memory context
    const memoryContext = await memoryVault.buildMemoryContext(message);

    // Stream response
    const stream = await copilotAdapter.streamResponse(message, conversationId, memoryContext);
    
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
```

**Testing with curl:**
```bash
curl -X POST https://muse-backend.azurewebsites.net/api/copilot/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"What is my name?","conversationId":"test-1"}'
```

**Expected output:** SSE stream with chunks appearing in real-time

---

### PART 3: Test Locally (1 hour)

#### Step 3.1: Start backend locally
```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
Server running on http://localhost:8080
Routes registered:
  GET /api/copilot/status
  POST /api/copilot/auth/login
  POST /api/copilot/chat/stream ← NEW
```

#### Step 3.2: Test with curl from another terminal
```bash
curl -X POST http://localhost:8080/api/copilot/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"What should I focus on today?","conversationId":"local-test"}'
```

**Expected output:**
```
data: {"chunk":"I received your question"}
data: {"chunk":": \"What shoul"}
data: {"chunk":"d I focus on"}
...
data: [DONE]
```

#### Step 3.3: Test with Node.js client
**File:** `test-streaming.js` (create in backend root)
```javascript
const http = require('http');

const data = JSON.stringify({
  message: 'What are my upcoming deadlines?',
  conversationId: 'test-stream-1'
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/copilot/chat/stream',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    process.stdout.write(chunk);
  });
  
  res.on('end', () => {
    console.log('\n✅ Stream complete');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
```

**Run test:**
```bash
cd backend
node test-streaming.js
```

**Expected output:** Real-time streaming response

---

### PART 4: Verify Memory Integration (1 hour)

#### Step 4.1: Check vault path in your repo
```bash
ls -la vault/
# Should show: *.md files
```

If vault folder doesn't exist or is in wrong location:
```bash
# Create if missing
mkdir -p vault

# If it's in a different location, update MemoryVaultService:
// Change: vaultPath: string = '../vault'
// To:     vaultPath: string = process.env.VAULT_PATH || '../vault'
```

#### Step 4.2: Test memory loading
```bash
curl -X POST http://localhost:8080/api/copilot/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Remember when I said about my goals?","conversationId":"memory-test"}'
```

**Expected output:** Response includes relevant memories from vault files

---

### PART 5: Deploy v8 to Azure (1 hour)

#### Step 5.1: Update package.json version
**File:** `backend/package.json`
```json
{
  "name": "@muse/backend",
  "version": "8.0.0",  // ← Change from 7.0.0
  ...
}
```

#### Step 5.2: Build and test locally
```bash
cd backend
npm run build
npm start
```

**Verify:**
- No TypeScript errors
- Server starts
- `/api/copilot/chat/stream` responds

#### Step 5.3: Create deployment package
```bash
# From backend directory
npm run clean-deploy  # Creates muse-backend-deploy-v8.zip
```

#### Step 5.4: Upload to Azure
- Go to Azure Portal → App Service → muse-backend
- Click "Deployment center" → Manual deployment
- Upload `muse-backend-deploy-v8.zip`
- Wait for deployment to complete

#### Step 5.5: Test in Azure
```bash
curl -X POST https://muse-backend.azurewebsites.net/api/copilot/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Test streaming in production","conversationId":"prod-test"}'
```

**Expected output:** SSE stream with chunks

---

## PHASE 2 CHECKLIST

- [ ] **Memory Service** - MemoryVaultService.ts created and reads .md files
- [ ] **Streaming method** - CopilotStudioAdapter.streamResponse() implemented
- [ ] **Streaming endpoint** - POST /api/copilot/chat/stream route added
- [ ] **Local test 1** - curl test returns streaming response
- [ ] **Local test 2** - Node.js client receives stream chunks
- [ ] **Memory integration** - Response includes relevant vault memories
- [ ] **Package update** - version bumped to 8.0.0
- [ ] **Local build** - `npm run build` succeeds with no errors
- [ ] **Local start** - `npm start` launches successfully
- [ ] **Azure deployment** - v8 uploaded and running
- [ ] **Azure test** - curl to production endpoint returns stream
- [ ] **Documentation** - Updated docs/PHASE-2-COMPLETE.md

---

## TESTING CHECKLIST

Before claiming Phase 2 complete, verify ALL of these:

### Unit Tests
```bash
cd backend
npm test -- --testPathPattern="MemoryVaultService"
npm test -- --testPathPattern="CopilotStudioAdapter"
```

### Integration Tests
```bash
# Start local server in one terminal
npm run dev

# Run tests in another terminal
curl -X POST http://localhost:8080/api/copilot/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test 1","conversationId":"1"}' | grep -q "chunk" && echo "✅ Test 1 passed"

curl -X POST http://localhost:8080/api/copilot/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"test 2","conversationId":"2"}' | grep -q "DONE" && echo "✅ Test 2 passed"
```

### Production Tests
```bash
# Test against deployed Azure instance
curl -X POST https://muse-backend.azurewebsites.net/api/copilot/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"production test","conversationId":"prod-1"}' | head -20
```

---

## TROUBLESHOOTING

### Problem: "ENOENT: no such file or directory, scandir 'vault'"
**Solution:** Create vault folder
```bash
mkdir -p vault
# Add sample .md files for testing
echo "# My Goals\n\nFocus on learning TypeScript" > vault/goals.md
```

### Problem: Streaming endpoint returns 404
**Solution:** Ensure route is registered
```bash
# In backend/src/index.ts, verify:
app.use('/api/copilot', copilotRoutes);
```

### Problem: Vault reads but memory not in response
**Solution:** Check query matching logic
```bash
# Add logging to MemoryVaultService.findRelevantMemories():
console.log(`Searching vault for: "${query}"`);
console.log(`Found memories: ${relevant.length}`);
```

### Problem: Deployment to Azure fails
**Solution:** Verify local build first
```bash
cd backend
rm -rf dist node_modules package-lock.json
npm install --no-workspaces
npm run build
npm start
# Must start without errors before deployment
```

---

## SUCCESS CRITERIA

Phase 2 is complete when:

✅ Memory Service loads .md files from vault  
✅ Streaming endpoint returns chunks in real-time  
✅ Context includes relevant memories from vault  
✅ Local testing passes (curl, Node.js client)  
✅ Azure deployment succeeds and responds  
✅ Production endpoint streams responses  
✅ No errors in console logs  
✅ All docs updated  

---

## NEXT PHASE (PHASE 3)

Once Phase 2 is complete, Phase 3 begins:
- Audio capture from system microphone
- Azure Speech Services integration (STT/TTS)
- Voice input/output pipeline
- Full voice conversation with Muse

**Estimated Phase 3 duration:** 3-5 days

---

## QUESTIONS?

If you get stuck on any step:
1. Check the error message carefully
2. Run the local tests with `curl` to isolate the issue
3. Add `console.log()` statements to trace execution
4. Read the TypeScript compiler errors - they're specific

Once Phase 2 is complete and all tests pass, we'll move to Phase 3.

Good luck! 🚀
