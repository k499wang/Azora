import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface DailyExerciseButtonProps {
  onPress: () => void;
}

export default function DailyExerciseButton({ onPress }: DailyExerciseButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      onPress={onPress}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(222, 250, 255, 0)',
          'rgba(106, 211, 255, 0.42)',
          'rgba(47, 122, 239, 0.52)',
          'rgba(92, 232, 195, 0.3)',
        ]}
        locations={[0, 0.38, 0.72, 1]}
        start={{ x: 0.05, y: 0.05 }}
        end={{ x: 0.95, y: 0.95 }}
        style={[styles.glowLayer, styles.outerGlow]}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(234, 248, 255, 0.74)',
          'rgba(95, 186, 255, 0.8)',
          'rgba(41, 114, 230, 0.58)',
          'rgba(116, 238, 205, 0.52)',
        ]}
        locations={[0, 0.32, 0.68, 1]}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 0.85 }}
        style={[styles.glowLayer, styles.middleGlow]}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(255, 255, 255, 0.92)',
          'rgba(118, 195, 255, 0.86)',
          'rgba(47, 122, 239, 0.76)',
          'rgba(93, 222, 194, 0.72)',
        ]}
        locations={[0, 0.28, 0.68, 1]}
        start={{ x: 0.14, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={[styles.glowLayer, styles.innerGlow]}
      />

      <View style={styles.glowWrap}>
        <LinearGradient
          colors={['#F5FCFF', '#7FD7FF', '#2F7AEF', '#5DE5C8']}
          locations={[0, 0.3, 0.68, 1]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={styles.gradientRing}
        >
          <LinearGradient
            colors={[colors.primary.blue500, colors.primary.blue700]}
            start={{ x: 0.18, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.label}>start</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
    width: 174,
    height: 174,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: {
    position: 'absolute',
    shadowColor: colors.primary.blue500,
    shadowOffset: { width: 0, height: 0 },
  },
  outerGlow: {
    width: 174,
    height: 174,
    borderRadius: 87,
    opacity: 0.72,
    shadowOpacity: 0.34,
    shadowRadius: 34,
    elevation: 10,
  },
  middleGlow: {
    width: 158,
    height: 158,
    borderRadius: 79,
    opacity: 0.56,
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 12,
  },
  innerGlow: {
    width: 142,
    height: 142,
    borderRadius: 71,
    opacity: 0.68,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 14,
  },
  glowWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    shadowColor: colors.primary.blue500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.58,
    shadowRadius: 20,
    elevation: 16,
  },
  gradientRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 5,
  },
  button: {
    flex: 1,
    borderRadius: 60,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  label: {
    ...typography.button.large,
    color: colors.text.inverse,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 20,
  },
});
