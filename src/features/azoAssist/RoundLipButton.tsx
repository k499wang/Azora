import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CHUNKY_LIP_DEPTH } from '../../components/common/ChunkyButton';
import type { PlayfulHue } from '../exercise/guidedBreathing/categoryPalette';
import { triggerTapHaptic } from '../../native/tapHaptics';

interface Props {
  size: number;
  hue: PlayfulHue;
  accessibilityLabel: string;
  disabled?: boolean;
  busy?: boolean;
  onPress: () => void;
  children: ReactNode;
}

/** A circular face on a darker lip, for the Ask Azo composer's mic and send. */
export default function RoundLipButton({ size, hue, accessibilityLabel, disabled = false, busy = false, onPress, children }: Props) {
  const round = { width: size, borderRadius: size / 2 };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, busy }}
      disabled={disabled || busy}
      hitSlop={4}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={[round, { height: size + CHUNKY_LIP_DEPTH, backgroundColor: hue.ink }, disabled && styles.disabled]}
    >
      {({ pressed }) => (
        <View style={[round, styles.face, { height: size, backgroundColor: hue.base }, pressed && styles.facePressed]}>
          {children}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: { alignItems: 'center', justifyContent: 'center' },
  facePressed: { transform: [{ translateY: CHUNKY_LIP_DEPTH }] },
  disabled: { opacity: 0.45 },
});
