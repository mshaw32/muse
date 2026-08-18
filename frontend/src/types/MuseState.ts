export type MuseState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "alert"
  | "error";

export interface MuseMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface MuseSettings {
  voiceEnabled: boolean;
  wakeWordEnabled: boolean;
  volume: number;
  theme: "dark" | "light";
  /** Phase 4 additions — persisted alongside the existing voice settings above. */
  autoStartListening: boolean;
  pushToTalkEnabled: boolean;
}
