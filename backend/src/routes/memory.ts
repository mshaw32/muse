import { Router, Request, Response } from "express";
import { getRuntime } from "../runtime";
import { MemoryCategory } from "@muse/services";

const router = Router();

/**
 * POST /api/memory/store
 * Stores a new long-term memory entry (preference, decision, project, etc.)
 */
router.post("/store", (req: Request, res: Response) => {
  const { category, title, content, tags, source } = req.body ?? {};

  if (typeof title !== "string" || typeof content !== "string" || typeof category !== "string") {
    res.status(400).json({ status: "error", message: "\"category\", \"title\", and \"content\" are required." });
    return;
  }

  const entry = getRuntime().memory.store({
    category: category as MemoryCategory,
    title,
    content,
    tags,
    source,
  });

  res.json({ status: "ok", entry });
});

/**
 * POST /api/memory/search
 * Searches long-term memory and the local vault index.
 */
router.post("/search", (req: Request, res: Response) => {
  const { query, mode, category, limit } = req.body ?? {};

  if (typeof query !== "string") {
    res.status(400).json({ status: "error", message: "\"query\" is required." });
    return;
  }

  const memoryResults = getRuntime().memory.search({ query, mode, category, limit });
  const vaultResults = getRuntime().memory.searchVault(query, limit);

  res.json({ status: "ok", memoryResults, vaultResults });
});

export default router;
