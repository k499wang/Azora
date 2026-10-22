type SpeechModule = typeof import('expo-speech');

const SPEECH_RATE = 0.95;

let speech: SpeechModule | null | undefined;

// Loaded on first use: expo-speech throws at import on a build without its native module.
function loadSpeech(): SpeechModule | null {
  if (speech === undefined) {
    try {
      speech = require('expo-speech') as SpeechModule;
    } catch {
      speech = null;
    }
  }
  return speech;
}

export function speakRoutineLine(text: string): void {
  const module = loadSpeech();
  if (module == null) return;
  try {
    void module.stop().catch(() => {});
    module.speak(text, { rate: SPEECH_RATE });
  } catch {}
}

export function stopRoutineVoice(): void {
  const module = loadSpeech();
  if (module == null) return;
  try {
    void module.stop().catch(() => {});
  } catch {}
}
