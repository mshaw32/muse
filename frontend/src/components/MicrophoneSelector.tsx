/**
 * MicrophoneSelector — lists available microphones and allows selecting +
 * persisting the active one via the Phase 4 voice backend.
 */

import { useVoice } from "../hooks/useVoice";
import "./DeviceSelector.css";

export default function MicrophoneSelector() {
  const { microphones, microphoneDevice, selectMicrophone } = useVoice();

  return (
    <div className="device-selector">
      <label htmlFor="microphone-select">Microphone</label>
      <select
        id="microphone-select"
        className="device-selector-select"
        value={microphoneDevice?.id ?? ""}
        onChange={(event) => void selectMicrophone(event.target.value)}
      >
        {microphones.length === 0 && <option value="">No microphones found</option>}
        {microphones.map((device) => (
          <option key={device.id} value={device.id}>
            {device.label}
            {device.isDefault ? " (default)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
