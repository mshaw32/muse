import { Router, Request, Response } from "express";
import { getRuntime } from "../runtime";

const router = Router();

/**
 * GET /api/actions
 * Lists all registered actions (plugin catalog).
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", actions: getRuntime().actions.listActions() });
});

/**
 * POST /api/actions/execute
 * Executes a registered action. Consequential actions (delete, approval
 * category, or plugin-flagged) return `awaiting_approval` until the caller
 * resubmits with `approvedByUser: true`.
 */
router.post("/execute", async (req: Request, res: Response) => {
  const { actionId, parameters, approvedByUser, requestedBy, conversationId } = req.body ?? {};

  if (typeof actionId !== "string") {
    res.status(400).json({ status: "error", message: "\"actionId\" is required." });
    return;
  }

  const result = await getRuntime().actions.execute({
    actionId,
    parameters: parameters ?? {},
    approvedByUser,
    requestedBy,
    conversationId,
  });

  res.json({ status: "ok", result });
});

export default router;
