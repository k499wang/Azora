import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export const VOICE_NOTE_MAX_MS = 60_000;

const NOT_HEARD = 'Azo didn’t catch that. Try again.';

export type VoiceNotePhase = 'idle' | 'recording' | 'transcribing';

/** The recognizer's volume (-2 to 10, below 0 inaudible) as dBFS, roughly -60 (quiet) to 0 (loud). */
const volumeAsDb = (value: number) => -60 + (Math.min(10, Math.max(-2, value)) + 2) * 5;

const deviceLocale = () => Intl.DateTimeFormat().resolvedOptions().locale;

/**
 * Tap to talk, tap to stop: the phone's own speech recognizer writes the words
 * down live, and the finished text is handed back once it stops.
 */
export function useVoiceNote({ onText }: { onText: (text: string) => void }) {
  const [phase, setPhase] = useState<VoiceNotePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [durationMillis, setDurationMillis] = useState(0);
  const [metering, setMetering] = useState(-60);
  // Events arrive outside render, so the session lives in refs.
  const phaseRef = useRef<VoiceNotePhase>('idle');
  const finals = useRef<string[]>([]);
  const interim = useRef('');
  const startedAt = useRef(0);
  const failed = useRef(false);
  const mounted = useRef(true);
  const permissionPending = useRef(false);
  const session = useRef(0);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const moveTo = (next: VoiceNotePhase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const heard = () => [...finals.current, interim.current].join(' ').replace(/\s+/g, ' ').trim();

  const start = useCallback(async () => {
    if (!mounted.current || permissionPending.current) return;
    const currentSession = ++session.current;
    permissionPending.current = true;
    setError(null);
    let permission;
    try {
      permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    } finally {
      permissionPending.current = false;
    }
    // A blur can cancel while the system permission prompt is still open.
    if (currentSession !== session.current) return;
    if (!permission.granted) {
      Alert.alert('Microphone access needed', 'Allow microphone and speech recognition in Settings to talk to Azo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => { void Linking.openSettings(); } },
      ]);
      return;
    }
    finals.current = [];
    interim.current = '';
    failed.current = false;
    startedAt.current = Date.now();
    setTranscript('');
    setDurationMillis(0);
    setMetering(-60);
    moveTo('recording');
    ExpoSpeechRecognitionModule.start({
      lang: deviceLocale(),
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
      iosTaskHint: 'dictation',
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
    });
  }, []);

  const stop = useCallback(() => {
    if (phaseRef.current !== 'recording') return;
    moveTo('transcribing');
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const cancel = useCallback(() => {
    session.current += 1;
    const active = phaseRef.current !== 'idle';
    phaseRef.current = 'idle';
    finals.current = [];
    interim.current = '';
    if (mounted.current) {
      setPhase('idle');
      setTranscript('');
      setDurationMillis(0);
      setMetering(-60);
      setError(null);
    }
    // Abort may emit end synchronously; invalidate first so it cannot submit.
    if (active) ExpoSpeechRecognitionModule.abort();
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    if (phaseRef.current === 'idle') return;
    const text = event.results[0]?.transcript ?? '';
    // Some recognizers finish a phrase at each pause and start the next afresh.
    if (event.isFinal) {
      finals.current.push(text);
      interim.current = '';
    } else {
      interim.current = text;
    }
    setTranscript(heard());
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    if (phaseRef.current !== 'recording') return;
    const elapsed = Date.now() - startedAt.current;
    setMetering(volumeAsDb(event.value));
    setDurationMillis(elapsed);
    if (elapsed >= VOICE_NOTE_MAX_MS) stop();
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (phaseRef.current === 'idle') return;
    if (event.error === 'aborted') return;
    failed.current = true;
    setError(event.error === 'no-speech' || event.error === 'speech-timeout' ? NOT_HEARD : event.message || NOT_HEARD);
  });

  useSpeechRecognitionEvent('end', () => {
    if (phaseRef.current === 'idle') return;
    moveTo('idle');
    if (failed.current) return;
    const text = heard();
    if (text.length === 0) setError(NOT_HEARD);
    else onTextRef.current(text);
  });

  // Leaving mid-sentence drops what was said rather than acting on it.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    phase,
    cancel,
    error,
    clearError: () => setError(null),
    /** the words heard so far, updated as they are spoken */
    transcript,
    durationMillis,
    /** dBFS, roughly -60 (quiet) to 0 (loud) */
    metering,
    toggle: () => {
      if (phaseRef.current === 'recording') stop();
      else if (phaseRef.current === 'idle') void start();
    },
  };
}
