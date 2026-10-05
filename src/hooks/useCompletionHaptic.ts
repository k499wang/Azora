import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { AppState } from 'react-native';
import {
  triggerActivityCompleteHaptic,
  triggerBreathingCompleteHaptic,
} from '../native/tapHaptics';

/** A single completion tap when the focused result finishes opening. */
export function useCompletionHaptic(kind: 'activity' | 'breathing', active: boolean) {
  const focused = useIsFocused();
  const played = useRef(false);

  useEffect(() => {
    if (!active || !focused || played.current) return;
    if (AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
    played.current = true;
    if (kind === 'breathing') triggerBreathingCompleteHaptic();
    else triggerActivityCompleteHaptic();
  }, [active, focused, kind]);
}
