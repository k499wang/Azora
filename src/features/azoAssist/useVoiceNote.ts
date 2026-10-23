import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import {
  AudioQuality,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { transcribeVoiceNote } from '../../services/azoAssist/azoAssistService';

export const VOICE_NOTE_MAX_MS = 60_000;

/** Speech only needs a small mono file; a minute stays well under the server cap. */
const VOICE_NOTE_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16_000,
  numberOfChannels: 1,
  bitRate: 32_000,
  isMeteringEnabled: true,
  ios: { ...RecordingPresets.HIGH_QUALITY.ios, audioQuality: AudioQuality.LOW },
};

export type VoiceNotePhase = 'idle' | 'recording' | 'transcribing';

async function fileAsBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that voice note.'));
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Tap to talk, tap to stop: the note is written down by Azo and handed back as
 * text, so the person can read what was heard before anything is sent.
 */
export function useVoiceNote({ onText }: { onText: (text: string) => void }) {
  const recorder = useAudioRecorder(VOICE_NOTE_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 100);
  const [phase, setPhase] = useState<VoiceNotePhase>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone access needed', 'Allow microphone access in Settings to talk to Azo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => { void Linking.openSettings(); } },
      ]);
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase('recording');
  }, [recorder]);

  const stop = useCallback(async () => {
    if (phase !== 'recording') return;
    setPhase('transcribing');
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (recorder.uri == null) throw new Error('Azo didn’t catch that. Try again.');
      onText(await transcribeVoiceNote(await fileAsBase64(recorder.uri)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Azo didn’t catch that. Try again.');
    } finally {
      setPhase('idle');
    }
  }, [onText, phase, recorder]);

  useEffect(() => {
    if (phase === 'recording' && recorderState.durationMillis >= VOICE_NOTE_MAX_MS) void stop();
  }, [phase, recorderState.durationMillis, stop]);

  // The recorder is released with the screen; only the session mode is ours to hand back.
  useEffect(() => () => { void setAudioModeAsync({ allowsRecording: false }); }, []);

  return {
    phase,
    error,
    durationMillis: recorderState.durationMillis,
    /** dBFS, roughly -60 (quiet) to 0 (loud) */
    metering: recorderState.metering ?? -60,
    toggle: () => { void (phase === 'recording' ? stop() : phase === 'idle' ? start() : undefined); },
  };
}
