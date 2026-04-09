import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface DailyExerciseButtonProps {
  onPress: () => void;
}

export default function DailyExerciseButton({ onPress }: DailyExerciseButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title}>Daily exercise</Text>
          <Text style={styles.subtitle}>
            Start your breath hold exercise.
          </Text>
        </View>
        <View style={styles.visual}>
          <MaterialCommunityIcons name="chevron-right" size={30} color={colors.text.inverse} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.inverse,
  },
  subtitle: {
    ...typography.body.xsmall,
    color: colors.primary.blue100,
    maxWidth: 240,
    lineHeight: 18,
  },
  visual: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
