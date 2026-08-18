/**
 * SpeakerSelector — lists available speakers and allows selecting +
 * persisting the active one via the Phase 4 voice backend.
 */

import { useVoice } from "../hooks/useVoice";
import "./DeviceSelector.css";

export default function SpeakerSelector() {
  const { speakers, speakerDevice, selectSpeaker } = useVoice();

  return (
    <div className="device-selector">
      <label htmlFor="speaker-select">Speaker</label>
      <select
        id="speaker-select"
        className="device-selector-select"
        value={speakerDevice?.id ?? ""}
        onChange={(event) => void selectSpeaker(event.target.value)}
      >
        {speakers.length === 0 && <option value="">No speakers found</option>}
        {speakers.map((device) => (
          <option key={device.id} value={device.id}>
            {device.label}
            {device.isDefault ? " (default)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
