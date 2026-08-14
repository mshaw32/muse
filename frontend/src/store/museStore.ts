import { create } from "zustand";
import type { MuseMessage, MuseSettings, MuseState } from "../types/MuseState";

interface MuseStore {
  /** Current visualizer / conversation state */
  museState: MuseState;
  /** Conversation transcript */
  transcript: MuseMessage[];
  /** User configurable settings */
  settings: MuseSettings;
  /** Unique identifier for the current session */
  sessionId: string;

  setState: (state: MuseState) => void;
  addMessage: (role: MuseMessage["role"], text: string) => void;
  clearMessages: () => void;
  updateSettings: (settings: Partial<MuseSettings>) => void;
  resetSession: () => void;
}

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useMuseStore = create<MuseStore>((set) => ({
  museState: "idle",
  transcript: [],
  settings: {
    voiceEnabled: true,
    wakeWordEnabled: false,
    volume: 0.8,
    theme: "dark",
  },
  sessionId: generateSessionId(),

  setState: (state) => set({ museState: state }),

  addMessage: (role, text) =>
    set((store) => ({
      transcript: [
        ...store.transcript,
        {
          id: generateSessionId(),
          role,
          text,
          timestamp: Date.now(),
        },
      ],
    })),

  clearMessages: () => set({ transcript: [] }),

  updateSettings: (settings) =>
    set((store) => ({ settings: { ...store.settings, ...settings } })),

  resetSession: () => set({ sessionId: generateSessionId() }),
}));
