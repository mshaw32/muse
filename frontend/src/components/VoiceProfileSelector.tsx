/**
 * VoiceProfileSelector — lets the user pick which voice MUSE speaks with.
 *
 * Offers the built-in MUSE voice profiles (each mapped to a real Azure AI
 * Foundry neural voice — see `services/src/voice/foundry/FoundryTextToSpeech.ts`),
 * plus a "Custom Azure voice" option where any real Azure neural voice name
 * (e.g. `en-US-JennyNeural`) can be typed in directly. The selection is
 * persisted (via `voiceStore`) and used as the default `voiceProfileId` for
 * every `speak()` call unless a call explicitly overrides it.
 */

import { useEffect, useState } from "react";
import { useVoice } from "../hooks/useVoice";
import "./DeviceSelector.css";
import "./VoiceProfileSelector.css";

const CUSTOM_OPTION_VALUE = "__custom__";

export default function VoiceProfileSelector() {
  const { voiceProfiles, selectedVoiceProfileId, selectVoiceProfile } = useVoice();

  const builtInIds = voiceProfiles.map((profile) => profile.id);
  const isCustomSelection = selectedVoiceProfileId.length > 0 && !builtInIds.includes(selectedVoiceProfileId);

  const [customVoiceName, setCustomVoiceName] = useState(isCustomSelection ? selectedVoiceProfileId : "");
  const [showCustomInput, setShowCustomInput] = useState(isCustomSelection);

  // Keep the local custom-input state in sync if the selection changes
  // elsewhere (e.g. loaded from localStorage on mount).
  useEffect(() => {
    if (isCustomSelection) {
      setCustomVoiceName(selectedVoiceProfileId);
      setShowCustomInput(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoiceProfileId]);

  return (
    <div className="device-selector voice-profile-selector">
      <label htmlFor="voice-profile-select">Voice</label>
      <select
        id="voice-profile-select"
        className="device-selector-select"
        value={showCustomInput ? CUSTOM_OPTION_VALUE : selectedVoiceProfileId}
        onChange={(event) => {
          const value = event.target.value;
          if (value === CUSTOM_OPTION_VALUE) {
            setShowCustomInput(true);
            if (customVoiceName.trim().length > 0) {
              selectVoiceProfile(customVoiceName.trim());
            }
            return;
          }
          setShowCustomInput(false);
          selectVoiceProfile(value);
        }}
      >
        {voiceProfiles.length === 0 && <option value="">No voice profiles found</option>}
        {voiceProfiles.map((profile) => (
          <option key={profile.id} value={profile.id} title={profile.description}>
            {profile.name}
          </option>
        ))}
        <option value={CUSTOM_OPTION_VALUE}>Custom Azure voice…</option>
      </select>

      {showCustomInput && (
        <div className="voice-profile-custom">
          <input
            type="text"
            className="voice-profile-custom-input"
            placeholder="e.g. en-US-JennyNeural"
            value={customVoiceName}
            onChange={(event) => setCustomVoiceName(event.target.value)}
            onBlur={() => {
              const trimmed = customVoiceName.trim();
              if (trimmed.length > 0) {
                selectVoiceProfile(trimmed);
              }
            }}
          />
          <span className="voice-profile-custom-hint">
            Any Azure neural voice name (see Microsoft's neural voice gallery).
          </span>
        </div>
      )}
    </div>
  );
}
