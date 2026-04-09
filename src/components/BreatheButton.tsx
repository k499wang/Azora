import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

interface BreatheButtonProps {
  onPress: () => void;
}

const SIZE = 300;

export default function BreatheButton({ onPress }: BreatheButtonProps) {
  return (
    <View style={styles.wrapper}>
      {/* Outer ambient glow */}
      <View style={styles.glowOuter} />
      {/* Inner glow ring */}
      <View style={styles.glowInner} />
      <Pressable
        style={({ pressed }) => [
          styles.outer,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        <View style={styles.solidBg} />
        <View style={styles.inner} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE + 80,
    height: SIZE + 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: SIZE + 80,
    height: SIZE + 80,
    borderRadius: (SIZE + 80) / 2,
    backgroundColor: colors.primary.blue400,
    opacity: 0.08,
  },
  glowInner: {
    position: 'absolute',
    width: SIZE + 40,
    height: SIZE + 40,
    borderRadius: (SIZE + 40) / 2,
    backgroundColor: colors.primary.blue500,
    opacity: 0.12,
  },
  outer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 14,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  solidBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary.blue600,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
