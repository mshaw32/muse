import { useEffect, useState } from "react";
import type { WindowMode } from "../../types/electron";
import "./DesktopControls.css";

const WINDOW_MODES: WindowMode[] = ["normal", "always-on-top", "mini", "floating"];

export default function DesktopControls() {
  const [isElectron, setIsElectron] = useState(false);
  const [windowMode, setWindowMode] = useState<WindowMode>("normal");
  const [launchAtLogin, setLaunchAtLoginState] = useState(false);

  useEffect(() => {
    const museAPI = window.museAPI;
    if (!museAPI) return;

    setIsElectron(true);
    void museAPI.getWindowMode().then(setWindowMode);
    void museAPI.getSettings().then((settings) => {
      setLaunchAtLoginState(settings.startupMode === "launch-at-login");
    });
  }, []);

  if (!isElectron) {
    return (
      <p className="desktop-controls-web-note">
        Window modes, hotkeys, and startup options are available when MUSE runs as
        a desktop app via <code>npm run electron</code>.
      </p>
    );
  }

  const handleModeChange = async (mode: WindowMode) => {
    const museAPI = window.museAPI;
    if (!museAPI) return;
    const updated = await museAPI.setWindowMode(mode);
    setWindowMode(updated);
  };

  const handleLaunchToggle = async () => {
    const museAPI = window.museAPI;
    if (!museAPI) return;
    const next = !launchAtLogin;
    await museAPI.setLaunchAtLogin(next);
    setLaunchAtLoginState(next);
  };

  return (
    <div className="desktop-controls">
      <div className="desktop-controls-row">
        <span className="desktop-controls-label">Window Mode</span>
        <div className="desktop-controls-mode-grid">
          {WINDOW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`desktop-controls-mode-btn${mode === windowMode ? " active" : ""}`}
              onClick={() => void handleModeChange(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="desktop-controls-row">
        <span className="desktop-controls-label">Launch at Login</span>
        <button
          type="button"
          className={`desktop-controls-toggle${launchAtLogin ? " active" : ""}`}
          onClick={() => void handleLaunchToggle()}
        >
          {launchAtLogin ? "On" : "Off"}
        </button>
      </div>

      <div className="desktop-controls-row">
        <span className="desktop-controls-label">Global Hotkey</span>
        <code className="desktop-controls-hotkey">Ctrl/Cmd + Shift + Space</code>
      </div>
    </div>
  );
}
