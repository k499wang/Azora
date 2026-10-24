import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from '../../components/common/icons/Icon';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import type { VoiceNotePhase } from './useVoiceNote';

interface Props {
  phase: VoiceNotePhase;
  /** dBFS from the recorder; louder speech grows the halo */
  metering: number;
  size?: number;
  onPress: () => void;
}

/** A quiet mic inside the glass composer that starts and stops a voice note; the halo breathes with the speaker's voice. */
export default function VoiceNoteButton({ phase, metering, size = 48, onPress }: Props) {
  const reducedMotion = useReducedMotion();
  const level = useSharedValue(0);
  const recording = phase === 'recording';
  const hue = recording ? colors.playful.coral : colors.playful.sky;

  useEffect(() => {
    const loudness = recording ? Math.min(1, Math.max(0, (metering + 50) / 45)) : 0;
    level.value = withTiming(reducedMotion ? 0 : loudness, { duration: 120 });
  }, [level, metering, recording, reducedMotion]);

  const halo = useAnimatedStyle(() => ({
    opacity: recording ? 0.35 + level.value * 0.4 : 0,
    transform: [{ scale: 1 + level.value * 0.45 }],
  }));

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { width: size, height: size, borderRadius: size / 2, backgroundColor: hue.tint }, halo]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Stop voice note' : 'Talk instead of typing'}
        accessibilityState={{ disabled: phase === 'transcribing' }}
        disabled={phase === 'transcribing'}
        hitSlop={Math.max(0, (44 - size) / 2)}
        onPress={() => {
          triggerTapHaptic();
          onPress();
        }}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          pressed && pressable.control,
        ]}
      >
        {phase === 'transcribing'
          ? <ActivityIndicator size="small" color={hue.ink} />
          : recording
            ? <View style={[styles.stopMark, { backgroundColor: hue.ink }]} />
            : <Icon name="microphone" size={size * 0.6} color={colors.text.primary} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute', top: 0, left: 0 },
  button: { alignItems: 'center', justifyContent: 'center' },
  stopMark: { width: 16, height: 16, borderRadius: 4 },
});
