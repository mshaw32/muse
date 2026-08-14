import { Router, Request, Response } from "express";
import { getRuntime } from "../runtime";

const router = Router();

/**
 * POST /api/copilot/chat
 * Routes a question through the Microsoft 365 Copilot Chat Service.
 * Mock response until real Copilot API access is available (Phase 4).
 */
router.post("/chat", async (req: Request, res: Response) => {
  const { conversationId, question, context } = req.body ?? {};

  if (typeof question !== "string" || question.trim().length === 0) {
    res.status(400).json({ status: "error", message: "\"question\" is required." });
    return;
  }

  const response = await getRuntime().copilot.chat.askQuestion({ conversationId, question, context });
  res.json({ status: "ok", ...response });
});

/**
 * POST /api/copilot/retrieve
 * Routes an enterprise retrieval request through the Copilot Retrieval
 * Service. Mock response until real Copilot API access is available.
 * Optional `type` selects which retrieval method to call; defaults to
 * work-context.
 */
router.post("/retrieve", async (req: Request, res: Response) => {
  const { type, scope, query, limit } = req.body ?? {};
  const retrieval = getRuntime().copilot.retrieval;

  switch (type) {
    case "files": {
      const response = await retrieval.retrieveFiles({ scope, query, limit });
      res.json({ status: "ok", type: "files", ...response });
      return;
    }
    case "meetings": {
      const response = await retrieval.retrieveMeetings({ scope, query, limit });
      res.json({ status: "ok", type: "meetings", ...response });
      return;
    }
    case "projects": {
      const response = await retrieval.retrieveProjects({ scope, query, limit });
      res.json({ status: "ok", type: "projects", ...response });
      return;
    }
    case "tasks": {
      const response = await retrieval.retrieveTasks({ scope, query, limit });
      res.json({ status: "ok", type: "tasks", ...response });
      return;
    }
    case "work-context":
    default: {
      const response = await retrieval.retrieveWorkContext({ scope, query, limit });
      res.json({ status: "ok", type: "work-context", ...response });
      return;
    }
  }
});

export default router;
