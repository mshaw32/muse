import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useMuseStore } from "../store/museStore";
import "./PushToTalkButton.css";

export default function PushToTalkButton() {
  const museState = useMuseStore((state) => state.museState);
  const setState = useMuseStore((state) => state.setState);
  const addMessage = useMuseStore((state) => state.addMessage);
  const isListening = museState === "listening";
  const wasListeningRef = useRef(false);

  const startListening = useCallback(() => {
    if (museState === "error") return;
    wasListeningRef.current = true;
    setState("listening");
  }, [museState, setState]);

  const stopListening = useCallback(() => {
    if (!wasListeningRef.current) return;
    wasListeningRef.current = false;
    // Simulate hand-off to "thinking" once the user releases the button.
    setState("thinking");
    addMessage("user", "(voice input captured)");

    window.setTimeout(() => {
      setState("speaking");
      addMessage("assistant", "This is a placeholder MUSE response.");
    }, 1200);

    window.setTimeout(() => {
      setState("idle");
    }, 3200);
  }, [addMessage, setState]);

  return (
    <div className="push-to-talk-wrapper">
      <motion.button
        type="button"
        className={`push-to-talk-button${isListening ? " listening" : ""}`}
        onPointerDown={startListening}
        onPointerUp={stopListening}
        onPointerLeave={stopListening}
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
