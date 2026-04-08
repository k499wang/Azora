import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface BreatheButtonProps {
  onPress: () => void;
}

const SIZE = 240;

export default function BreatheButton({ onPress }: BreatheButtonProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.glow} />
      <Pressable
        style={({ pressed }) => [
          styles.outer,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        {/* Base gradient */}
        <LinearGradient
          colors={[colors.primary.blue400, colors.primary.blue600]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradient}
        />
        {/* Glass blur overlay */}
        <BlurView intensity={25} tint="light" style={styles.blurLayer} />
        {/* Glass surface */}
        <View style={styles.glassSurface}>
          {/* Top highlight / reflection */}
          <View style={styles.reflection} />
          <View style={styles.inner}>
            <Text style={styles.label}>Start</Text>
            <Text style={styles.sublabel}>Breathing</Text>
          </View>
        </View>
        {/* Inner border for glass edge */}
        <View style={styles.borderRing} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE + 48,
    height: SIZE + 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: SIZE + 48,
    height: SIZE + 48,
    borderRadius: (SIZE + 48) / 2,
    backgroundColor: colors.primary.blue400,
    opacity: 0.12,
  },
  outer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    shadowColor: colors.primary.blue600,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  glassSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  reflection: {
    position: 'absolute',
    top: -SIZE * 0.15,
    left: '15%',
    right: '15%',
    height: SIZE * 0.55,
    borderRadius: SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.display.display3,
    color: colors.text.inverse,
  },
  sublabel: {
    ...typography.body.medium,
    color: colors.text.inverse,
    opacity: 0.75,
  },
});
