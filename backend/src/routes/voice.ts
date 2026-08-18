import { Router, Request, Response } from "express";
import { getRuntime } from "../runtime";
import { getVoiceIntegration } from "../services/voice";

const router = Router();

// ---------------------------------------------------------------------------
// Phase 1/2 endpoints (preserved unchanged below). Phase 4 adds new session
// lifecycle/status endpoints alongside them without altering their existing
// request/response contracts.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Phase 4 endpoints — Azure AI Foundry Voice realtime session lifecycle.
// ---------------------------------------------------------------------------

/**
 * POST /api/voice/start
 * Starts a Phase 4 realtime voice session (mock STT streaming begins
 * immediately; poll GET /api/voice/status for partial/final transcripts).
 */
router.post("/start", (_req: Request, res: Response) => {
  try {
    const { session } = getVoiceIntegration().azureVoice.start();
    getVoiceIntegration().sessionManager.recordStart(session);
    res.json({ status: "ok", session });
  } catch (error) {
    res.status(500).json({ status: "error", message: error instanceof Error ? error.message : "start_failed" });
  }
});

/**
 * POST /api/voice/stop
 * Stops the active Phase 4 voice session and returns the final transcript.
 */
router.post("/stop", async (_req: Request, res: Response) => {
  try {
    const voiceIntegration = getVoiceIntegration();
    const { session, transcript } = await voiceIntegration.azureVoice.stop();
    voiceIntegration.sessionManager.recordStop(session?.id, transcript);
    res.json({ status: "ok", session, transcript });
  } catch (error) {
    res.status(500).json({ status: "error", message: error instanceof Error ? error.message : "stop_failed" });
  }
});

/**
 * POST /api/voice/speak
 * Synthesizes speech through the Phase 4 text-to-speech pipeline. Distinct
 * from the preserved `/synthesize` endpoint above (kept for backward
 * compatibility); functionally equivalent but routes through the Phase 4
 * `VoiceService.speakPhase4` seam.
 */
router.post("/speak", async (req: Request, res: Response) => {
  const { text, voiceProfileId, rate, pitch } = req.body ?? {};

  if (typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ status: "error", message: "\"text\" is required." });
    return;
  }

  try {
    const result = await getVoiceIntegration().azureVoice.speak(text, voiceProfileId, rate, pitch);
    res.json({ status: "ok", result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error instanceof Error ? error.message : "speak_failed" });
  }
});

/**
 * GET /api/voice/status
 * Reports the current voice session/device/provider status, plus any
 * partial or final transcript captured since the last poll, for the
 * frontend `VoiceStatus`/`VoicePanel` components.
 */
router.get("/status", (_req: Request, res: Response) => {
  const voiceIntegration = getVoiceIntegration().azureVoice;
  const status = voiceIntegration.getStatus();
  res.json({
    status: "ok",
    ...status,
    partialTranscript: voiceIntegration.getPartialTranscript(),
    finalTranscript: voiceIntegration.getLastTranscript(),
  });
});

/**
 * POST /api/voice/devices/microphone
 * Selects and persists the active microphone.
 */
router.post("/devices/microphone", (req: Request, res: Response) => {
  const { deviceId } = req.body ?? {};
  if (typeof deviceId !== "string") {
    res.status(400).json({ status: "error", message: "\"deviceId\" is required." });
    return;
  }
  const device = getVoiceIntegration().azureVoice.selectMicrophone(deviceId);
  res.json({ status: "ok", device });
});

/**
 * POST /api/voice/devices/speaker
 * Selects and persists the active speaker.
 */
router.post("/devices/speaker", (req: Request, res: Response) => {
  const { deviceId } = req.body ?? {};
  if (typeof deviceId !== "string") {
    res.status(400).json({ status: "error", message: "\"deviceId\" is required." });
    return;
  }
  const device = getVoiceIntegration().azureVoice.selectSpeaker(deviceId);
  res.json({ status: "ok", device });
});

/**
 * GET /api/voice/sessions/history
 * Returns recent voice session records (start/stop/transcript summary).
 */
router.get("/sessions/history", (_req: Request, res: Response) => {
  const history = getVoiceIntegration().sessionManager.history();
  res.json({ status: "ok", sessions: history });
});

export default router;
