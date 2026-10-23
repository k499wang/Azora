import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import RoundLipButton from './RoundLipButton';
import type { VoiceNotePhase } from './useVoiceNote';

interface Props {
  phase: VoiceNotePhase;
  /** dBFS from the recorder; louder speech grows the halo */
  metering: number;
  size?: number;
  onPress: () => void;
}

/** Starts and stops a voice note; the halo breathes with the speaker's voice. */
export default function VoiceNoteButton({ phase, metering, size = 48, onPress }: Props) {
  const reducedMotion = useReducedMotion();
  const level = useSharedValue(0);
  const recording = phase === 'recording';
  const hue = recording ? colors.playful.coral : colors.playful.violet;

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
      <RoundLipButton
        size={size}
        hue={hue}
        accessibilityLabel={recording ? 'Stop voice note' : 'Talk instead of typing'}
        busy={phase === 'transcribing'}
        onPress={onPress}
      >
        {phase === 'transcribing'
          ? <ActivityIndicator size="small" color={colors.text.inverse} />
          : recording
            ? <View style={styles.stopMark} />
            : <Icon name="microphone" size={size * 0.48} color={colors.text.inverse} />}
      </RoundLipButton>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute', top: 0, left: 0 },
  stopMark: { width: 16, height: 16, borderRadius: 4, backgroundColor: colors.text.inverse },
});
