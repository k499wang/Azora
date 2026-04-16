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
        colors={['#EAF2FF', '#78B4FF', '#2F7AEF', '#78B4FF']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glowAura}
      />

      <View style={styles.glowWrap}>
        <LinearGradient
          colors={['#EAF2FF', '#78B4FF', '#2F7AEF', '#4A90F5']}
          locations={[0, 0.28, 0.68, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.gradientRing}
        >
          <View style={styles.button}>
            <Text style={styles.label}>start</Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowAura: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.34,
    shadowColor: colors.primary.blue500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 14,
  },
  glowWrap: {
    width: 134,
    height: 134,
    borderRadius: 65,
    shadowColor: colors.primary.blue500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  gradientRing: {
    width: 134,
    height: 134,
    borderRadius: 67,
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
