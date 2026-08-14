import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /health
 * Basic liveness check for the MUSE backend service.
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({ status: "healthy" });
});

export default router;
