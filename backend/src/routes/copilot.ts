import { Router, Request, Response } from "express";
import { getRuntime } from "../runtime";
import { getCopilotIntegration } from "../services/copilot";

const router = Router();

// ---------------------------------------------------------------------------
// Phase 2 endpoints (preserved unchanged below). Phase 3 adds new
// conversation/streaming/status/auth endpoints alongside them without
// altering their existing request/response contracts.
// ---------------------------------------------------------------------------

/**
 * POST /api/copilot/chat
 * Routes a question through the Microsoft 365 Copilot Chat Service.
 *
 * Accepts either the Phase 2 contract (`question` / `conversationId`) or the
 * Phase 3 contract (`prompt` / `conversationId`) and always returns a
 * response containing both the Phase 2 fields (`answer`, `citations`) and
 * the Phase 3 fields (`reply`, `sources`) so existing and new consumers both
 * work unmodified.
 */
router.post("/chat", async (req: Request, res: Response) => {
  const { conversationId, question, prompt, context } = req.body ?? {};
  const text = typeof prompt === "string" ? prompt : question;

  if (typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ status: "error", message: "\"prompt\" is required." });
    return;
  }

  // Phase 2 mock response (preserved behavior — powers existing frontend/Sidebar flows).
  const phase2Response = await getRuntime().copilot.chat.askQuestion({ conversationId, question: text, context });

  // Phase 3 mock response (grounded answer + structured sources + citations + streaming state).
  const { conversation, message } = await getCopilotIntegration().chat.sendPrompt({
    conversationId,
    prompt: text,
  });

  res.json({
    status: "ok",
    // Phase 2 contract fields
    conversationId: phase2Response.conversationId,
    answer: phase2Response.answer,
    citations: phase2Response.citations,
    createdAt: phase2Response.createdAt,
    // Phase 3 contract fields
    reply: message.content,
    sources: message.sources ?? [],
    conversation,
    message,
  });
});

/**
 * POST /api/copilot/chat/stream
 * Streams a Copilot response as Server-Sent Events. Each event is a JSON
 * payload: `{ conversationId, delta, done, message? }`. The final event has
 * `done: true` and includes the complete assistant `message` (with sources
 * and citations).
 */
router.post("/chat/stream", async (req: Request, res: Response) => {
  const { conversationId, question, prompt } = req.body ?? {};
  const text = typeof prompt === "string" ? prompt : question;

  if (typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ status: "error", message: "\"prompt\" is required." });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const chat = getCopilotIntegration().chat;

  try {
    for await (const chunk of chat.streamResponse({ conversationId, prompt: text })) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "stream_failed" })}\n\n`);
  } finally {
    res.end();
  }
});

/**
 * POST /api/copilot/retrieve
 * Routes an enterprise retrieval request through the Copilot Retrieval
 * Service. Mock response until real Copilot API access is available.
 * Optional `type` selects which retrieval method to call; defaults to
 * work-context. Also returns a generic Phase 3 `results` array (structured
 * `Source[]`) alongside the existing typed Phase 2 fields.
 */
router.post("/retrieve", async (req: Request, res: Response) => {
  const { type, scope, query, limit } = req.body ?? {};
  const retrieval = getRuntime().copilot.retrieval;
  const phase3Retrieval = getCopilotIntegration().retrieval;
  const searchQuery = typeof query === "string" ? query : "";

  switch (type) {
    case "files": {
      const response = await retrieval.retrieveFiles({ scope, query, limit });
      const results = await phase3Retrieval.searchFiles({ query: searchQuery, limit });
      res.json({ status: "ok", type: "files", ...response, results: results.sources });
      return;
    }
    case "meetings": {
      const response = await retrieval.retrieveMeetings({ scope, query, limit });
      const results = await phase3Retrieval.searchMeetings({ query: searchQuery, limit });
      res.json({ status: "ok", type: "meetings", ...response, results: results.sources });
      return;
    }
    case "projects": {
      const response = await retrieval.retrieveProjects({ scope, query, limit });
      const results = await phase3Retrieval.searchProjects({ query: searchQuery, limit });
      res.json({ status: "ok", type: "projects", ...response, results: results.sources });
      return;
    }
    case "tasks": {
      const response = await retrieval.retrieveTasks({ scope, query, limit });
      const results = await phase3Retrieval.searchTasks({ query: searchQuery, limit });
      res.json({ status: "ok", type: "tasks", ...response, results: results.sources });
      return;
    }
    case "work-context":
    default: {
      const response = await retrieval.retrieveWorkContext({ scope, query, limit });
      const results = await phase3Retrieval.searchContext({ query: searchQuery, limit });
      res.json({ status: "ok", type: "work-context", ...response, results: results.sources });
      return;
    }
  }
});

// ---------------------------------------------------------------------------
// Phase 3 endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/copilot/status
 * Reports Copilot connection/authentication status for the frontend
 * `CopilotStatus` indicator.
 */
router.get("/status", (_req: Request, res: Response) => {
  const auth = getCopilotIntegration().auth.getStatus();
  res.json({ connected: auth.connectionStatus === "connected", ...auth });
});

/**
 * POST /api/copilot/auth/login
 * Authenticates against the mock Copilot identity provider.
 */
router.post("/auth/login", async (_req: Request, res: Response) => {
  const status = await getCopilotIntegration().auth.authenticate();
  res.json({ status: "ok", auth: status });
});

/**
 * POST /api/copilot/auth/logout
 * Clears the mock authentication session.
 */
router.post("/auth/logout", (_req: Request, res: Response) => {
  const status = getCopilotIntegration().auth.logout();
  res.json({ status: "ok", auth: status });
});

/**
 * POST /api/copilot/conversation/new
 * Starts a new Copilot conversation.
 */
router.post("/conversation/new", (_req: Request, res: Response) => {
  const conversation = getCopilotIntegration().conversation.startNew();
  res.json({ status: "ok", conversation });
});

/**
 * GET /api/copilot/conversation/active
 * Returns the currently active Copilot conversation, if any.
 */
router.get("/conversation/active", (_req: Request, res: Response) => {
  const conversation = getCopilotIntegration().conversation.getActive();
  res.json({ status: "ok", conversation: conversation ?? null });
});

/**
 * POST /api/copilot/conversation/clear
 * Clears the active conversation's messages.
 */
router.post("/conversation/clear", (_req: Request, res: Response) => {
  const conversation = getCopilotIntegration().conversation.clearActive();
  res.json({ status: "ok", conversation: conversation ?? null });
});

/**
 * GET /api/copilot/conversation/history
 * Lists all known conversations, most-recently-updated first.
 */
router.get("/conversation/history", (_req: Request, res: Response) => {
  const conversations = getCopilotIntegration().conversation.history();
  res.json({ status: "ok", conversations });
});

/**
 * POST /api/copilot/conversation/export
 * Exports a conversation as JSON or Markdown.
 */
router.post("/conversation/export", async (req: Request, res: Response) => {
  const { conversationId, format } = req.body ?? {};

  if (typeof conversationId !== "string") {
    res.status(400).json({ status: "error", message: "\"conversationId\" is required." });
    return;
  }

  try {
    const exported = await getCopilotIntegration().conversation.exportConversation(
      conversationId,
      format === "markdown" ? "markdown" : "json",
    );
    res.json({ status: "ok", export: exported });
  } catch (error) {
    res.status(404).json({ status: "error", message: error instanceof Error ? error.message : "export_failed" });
  }
});

/**
 * POST /api/copilot/conversation/summarize
 * Summarizes a conversation via the mock Copilot chat service.
 */
router.post("/conversation/summarize", async (req: Request, res: Response) => {
  const { conversationId } = req.body ?? {};

  if (typeof conversationId !== "string") {
    res.status(400).json({ status: "error", message: "\"conversationId\" is required." });
    return;
  }

  try {
    const summary = await getCopilotIntegration().chat.summarizeConversation(conversationId);
    res.json({ status: "ok", ...summary });
  } catch (error) {
    res.status(404).json({ status: "error", message: error instanceof Error ? error.message : "summarize_failed" });
  }
});

export default router;
