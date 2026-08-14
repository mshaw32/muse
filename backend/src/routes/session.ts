import { Router, Request, Response } from "express";
import { getRuntime } from "../runtime";

const router = Router();

/**
 * POST /api/session/start
 * Starts a new MUSE conversation session.
 */
router.post("/start", (req: Request, res: Response) => {
  const { title } = req.body ?? {};
  const conversation = getRuntime().conversationManager.startNew(title);
  res.json({ status: "ok", conversation });
});

/**
 * POST /api/session/end
 * Ends the current MUSE conversation session.
 */
router.post("/end", (_req: Request, res: Response) => {
  const activeConversation = getRuntime().conversationManager.getActive();
  getRuntime().conversationManager.endActive();
  res.json({ status: "ok", endedConversationId: activeConversation?.id ?? null });
});

export default router;
