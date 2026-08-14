/**
 * Bridges the optional Electron desktop shell (window.museAPI) and the
 * backend health check into MUSE's frontend state stores. Runs harmlessly
 * as a no-op bridge when MUSE is opened as a plain web page (no Electron,
 * no reachable backend).
 */

import { useEffect } from "react";
import { useMuseStore } from "../store/museStore";
import { useSystemStatusStore } from "../store/systemStatusStore";
import { museApiClient } from "../lib/api";

const HEALTH_POLL_INTERVAL_MS = 15000;

export function useElectronBridge(): void {
  const setMuseState = useMuseStore((state) => state.setState);
  const setConnection = useSystemStatusStore((state) => state.setConnection);

  useEffect(() => {
    const museAPI = window.museAPI;
    if (!museAPI) return undefined;

    const unsubscribeStart = museAPI.onStartConversation(() => {
      setMuseState("listening");
    });

    const unsubscribeSettings = museAPI.onOpenSettings(() => {
      // Settings visibility is owned by the existing SettingsPanel; the
      // desktop shell simply focuses the window (handled in main.ts). This
      // hook point exists so a future in-app settings deep link can react.
    });

    return () => {
      unsubscribeStart();
      unsubscribeSettings();
    };
  }, [setMuseState]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        await museApiClient.health();
        if (!cancelled) setConnection("connected");
      } catch {
        if (!cancelled) setConnection("disconnected");
      }
    }

    setConnection("connecting");
    void poll();
    const interval = window.setInterval(poll, HEALTH_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [setConnection]);
}
