import { DevSettings, Share } from 'react-native';
import type { PpgFrameSample } from '../../lib/heartRate/types';
import { createFrameRecorder } from '../../lib/heartRate/frameRecording';

// Dev-only capture of the raw PPG frame stream, exportable from the dev menu
// ("Share heart-rate recording") as JSON. Replay it through the real pipeline
// with `npm run replay:hr <file>` to debug live-BPM behavior against real
// sessions instead of synthetic waveforms.
const recorder = createFrameRecorder();
let menuRegistered = false;

export function recordDevFrame(frame: PpgFrameSample): void {
  if (!__DEV__) return;
  if (!menuRegistered) {
    menuRegistered = true;
    DevSettings.addMenuItem('Share heart-rate recording', () => {
      void shareRecording();
    });
  }
  recorder.push(frame);
}

async function shareRecording(): Promise<void> {
  if (recorder.frameCount() === 0) return;
  try {
    await Share.share({ message: recorder.serialize() });
  } catch {
    // Dev-only tool; a dismissed share sheet is not an error worth surfacing.
  }
}
