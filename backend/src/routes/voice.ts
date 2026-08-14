import { Router, Request, Response } from "express";
import { getRuntime } from "../runtime";

const router = Router();

/**
 * POST /api/voice
 * Preserved Phase 1 contract: placeholder for future Azure AI Foundry Voice
 * Live integration. Real streaming happens client-side in the Electron
 * renderer; this endpoint remains a stable not-implemented signal.
 */
router.post("/", (_req: Request, res: Response) => {
  res.json({ status: "not_implemented" });
});

/**
 * POST /api/voice/synthesize
 * Mock text-to-speech synthesis via the Azure AI Foundry Voice abstraction.
 */
router.post("/synthesize", async (req: Request, res: Response) => {
  const { text, voiceProfileId, rate, pitch } = req.body ?? {};

  if (typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ status: "error", message: "\"text\" is required." });
    return;
  }

  const result = await getRuntime().voice.speak({ text, voiceProfileId, rate, pitch });
  res.json({ status: "ok", result });
});

/**
 * GET /api/voice/devices
 * Returns mock microphone/speaker/voice-profile options.
 */
router.get("/devices", (_req: Request, res: Response) => {
  const runtime = getRuntime();
  res.json({
    status: "ok",
    microphones: runtime.voice.audio.listMicrophones(),
    speakers: runtime.voice.audio.listSpeakers(),
    voiceProfiles: runtime.voice.audio.listVoiceProfiles(),
  });
});

export default router;
