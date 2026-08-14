import { Router, Request, Response } from "express";

const router = Router();

/**
 * POST /api/voice
 * Placeholder endpoint for future Azure AI Foundry Voice Live integration.
 */
router.post("/", (_req: Request, res: Response) => {
  res.json({ status: "not_implemented" });
});

export default router;
