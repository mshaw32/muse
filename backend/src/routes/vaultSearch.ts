import { Router, Request, Response } from "express";

const router = Router();

/**
 * POST /api/vault-search
 * Placeholder endpoint for future Obsidian vault / Microsoft 365 search integration.
 */
router.post("/", (_req: Request, res: Response) => {
  res.json({ status: "not_implemented" });
});

export default router;
