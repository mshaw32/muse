/**
 * useVoice — Phase 4 voice integration hook.
 *
 * Bridges the Phase 4 `voiceStore` (Azure AI Foundry Voice session state)
 * onto the existing Phase 1 `museStore` (Visualizer state + Transcript
 * Panel) so voice sessions drive the same UI surfaces the mock
 * push-to-talk flow always has, without modifying `museStore`'s API or
 * the `MuseState` union.
 */

import { useCallback, useEffect } from "react";
import { useVoiceStore } from "../store/voiceStore";
import { useMuseStore } from "../store/museStore";
import type { VoiceState } from "../services/voice/VoiceModels";
import type { MuseState } from "../types/MuseState";

const VOICE_STATE_TO_MUSE_STATE: Record<VoiceState, MuseState> = {
  Idle: "idle",
  Listening: "listening",
  Processing: "thinking",
  Speaking: "speaking",
  Disconnected: "alert",
  Error: "error",
};

export function useVoice() {
  const voiceState = useVoiceStore((state) => state.voiceState);
  const isListening = useVoiceStore((state) => state.isListening);
  const isSpeaking = useVoiceStore((state) => state.isSpeaking);
  const microphoneDevice = useVoiceStore((state) => state.microphoneDevice);
  const speakerDevice = useVoiceStore((state) => state.speakerDevice);
  const microphones = useVoiceStore((state) => state.microphones);
  const speakers = useVoiceStore((state) => state.speakers);
  const currentTranscript = useVoiceStore((state) => state.currentTranscript);
  const partialTranscript = useVoiceStore((state) => state.partialTranscript);
  const isMock = useVoiceStore((state) => state.isMock);
  const error = useVoiceStore((state) => state.error);
  const voiceEnabled = useVoiceStore((state) => state.voiceEnabled);

  const loadDevices = useVoiceStore((state) => state.loadDevices);
  const selectMicrophone = useVoiceStore((state) => state.selectMicrophone);
  const selectSpeaker = useVoiceStore((state) => state.selectSpeaker);
  const startListeningAction = useVoiceStore((state) => state.startListening);
  const stopListeningAction = useVoiceStore((state) => state.stopListening);
  const speakAction = useVoiceStore((state) => state.speak);

  const setMuseState = useMuseStore((state) => state.setState);
  const addMessage = useMuseStore((state) => state.addMessage);

  // Visualizer Integration — mirror Phase 4 voice states onto the existing
  // MuseState visualizer without altering Visualizer.tsx.
  useEffect(() => {
    setMuseState(VOICE_STATE_TO_MUSE_STATE[voiceState]);
  }, [voiceState, setMuseState]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const startListening = useCallback(async () => {
    await startListeningAction();
  }, [startListeningAction]);

  const stopListening = useCallback(async () => {
    const transcript = await stopListeningAction();
    // Transcript Integration — voice transcripts automatically appear in
    // the Transcript Panel (and, transitively, Conversation History/Session
    // History via the same museStore transcript array they already read).
    if (transcript && transcript.text.trim().length > 0) {
      addMessage("user", transcript.text);
    }
    return transcript;
  }, [stopListeningAction, addMessage]);

  const speak = useCallback(
    async (text: string, voiceProfileId?: string) => {
      await speakAction(text, voiceProfileId);
      addMessage("assistant", text);
    },
    [speakAction, addMessage],
  );

  return {
    voiceEnabled,
    voiceState,
    isListening,
    isSpeaking,
    microphoneDevice,
    speakerDevice,
    microphones,
    speakers,
    currentTranscript,
    partialTranscript,
    isMock,
    error,
    startListening,
    stopListening,
    speak,
    selectMicrophone,
    selectSpeaker,
  };
}
