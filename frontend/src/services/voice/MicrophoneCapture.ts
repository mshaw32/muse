/**
 * MicrophoneCapture — real microphone capture for Azure AI Foundry Voice.
 *
 * Uses `navigator.mediaDevices.getUserMedia` (real hardware access — never
 * mocked) plus a `ScriptProcessorNode` to downsample captured audio to
 * 16kHz/16-bit/mono PCM, matching what `FoundrySpeechToText` expects on
 * the backend. Chunks are base64-encoded and POSTed to
 * `/api/voice/audio`, which feeds them into the live Foundry recognizer.
 *
 * `ScriptProcessorNode` is deprecated in favor of `AudioWorklet`, but is
 * used here deliberately: it works synchronously and consistently across
 * Electron's bundled Chromium without requiring a separate worklet module
 * to be served, keeping the capture pipeline simple and dependency-free.
 */

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

export class MicrophoneCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private onChunk: ((base64Pcm: string) => void) | null = null;

  /** True once real microphone permission has been granted and capture is active. */
  isCapturing(): boolean {
    return this.stream !== null;
  }

  /**
   * Requests real microphone access and begins streaming 16kHz/16-bit/mono
   * PCM chunks to `onChunk`. Throws if the user denies permission or no
   * microphone is available — callers should surface this as a real error,
   * not fall back to mock behavior.
   */
  async start(onChunk: (base64Pcm: string) => void, deviceId?: string | null): Promise<void> {
    if (this.stream) return;

    this.onChunk = onChunk;

    // The device list surfaced by `/api/voice/devices` today comes from
    // `AudioManager`'s placeholder device catalog (ids like "default-mic"),
    // not real hardware device ids from `navigator.mediaDevices`. Passing a
    // non-existent id as an `exact` constraint makes getUserMedia reject
    // immediately with OverconstrainedError. Only honor `deviceId` if it
    // actually matches a real, currently-enumerable input device;
    // otherwise fall back to the OS default microphone.
    const resolvedDeviceId = deviceId ? await this.resolveRealDeviceId(deviceId) : null;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: resolvedDeviceId ? { deviceId: { exact: resolvedDeviceId } } : true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextCtor: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
    this.audioContext = new AudioContextCtor();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.processorNode = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    const inputSampleRate = this.audioContext.sampleRate;

    this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleTo16kMono(inputData, inputSampleRate, TARGET_SAMPLE_RATE);
      const pcm16 = floatTo16BitPCM(downsampled);
      const base64 = arrayBufferToBase64(pcm16.buffer);
      this.onChunk?.(base64);
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  /**
   * Checks whether `deviceId` matches a real, currently-enumerable audio
   * input device (via `enumerateDevices`), returning it unchanged if so,
   * or `null` if it doesn't correspond to real hardware (e.g. one of the
   * placeholder mock device ids like "default-mic"/"headset-mic" surfaced
   * by the backend's `/api/voice/devices` route before real device
   * enumeration replaces it). Falling back to `null` lets `getUserMedia`
   * use the OS default microphone instead of throwing
   * `OverconstrainedError`.
   */
  private async resolveRealDeviceId(deviceId: string): Promise<string | null> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const match = devices.find((device) => device.kind === "audioinput" && device.deviceId === deviceId);
      return match ? deviceId : null;
    } catch {
      return null;
    }
  }

  stop(): void {
    this.processorNode?.disconnect();
    this.sourceNode?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.audioContext?.close();

    this.processorNode = null;
    this.sourceNode = null;
    this.stream = null;
    this.audioContext = null;
    this.onChunk = null;
  }
}

function downsampleTo16kMono(input: Float32Array, inputRate: number, targetRate: number): Float32Array {
  if (targetRate === inputRate) return input;
  const ratio = inputRate / targetRate;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i += 1) {
    result[i] = input[Math.floor(i * ratio)];
  }
  return result;
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
  let binary = "";
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export const microphoneCapture = new MicrophoneCapture();
