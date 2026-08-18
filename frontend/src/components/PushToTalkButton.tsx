import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useVoice } from "../hooks/useVoice";
import "./PushToTalkButton.css";

export default function PushToTalkButton() {
  const { voiceState, isListening, startListening, stopListening, speak } = useVoice();
  const wasListeningRef = useRef(false);

  const handleStart = useCallback(() => {
    if (voiceState === "Error") return;
    wasListeningRef.current = true;
    void startListening();
  }, [voiceState, startListening]);

  const handleStop = useCallback(() => {
    if (!wasListeningRef.current) return;
    wasListeningRef.current = false;

    void (async () => {
      const transcript = await stopListening();
      if (transcript && transcript.text.trim().length > 0) {
        // Phase 4: real (mock) voice-generated response, spoken back via the
        // Azure AI Foundry Voice text-to-speech pipeline.
        await speak(`I heard: "${transcript.text}"`);
      }
    })();
  }, [stopListening, speak]);

  return (
    <div className="push-to-talk-wrapper">
      <motion.button
        type="button"
        className={`push-to-talk-button${isListening ? " listening" : ""}`}
        onPointerDown={handleStart}
        onPointerUp={handleStop}
        onPointerLeave={handleStop}
        whileTap={{ scale: 0.94 }}
        animate={isListening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.6, repeat: isListening ? Infinity : 0 }}
        aria-pressed={isListening}
        aria-label="Push to talk"
      >
        <span className="push-to-talk-icon" aria-hidden>
          {isListening ? "●" : "🎙"}
        </span>
      </motion.button>
      <p className="push-to-talk-hint">
        {isListening ? "Listening… release to send" : "Press and hold to talk"}
      </p>
    </div>
  );
}
