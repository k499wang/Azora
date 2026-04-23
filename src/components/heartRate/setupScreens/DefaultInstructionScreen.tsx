import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import type { SetupScreenProps } from '../../../lib/heartRate/types';

const steps = [
  {
    icon: 'camera' as const,
    text: 'Cover the rear camera and flash fully with your fingertip',
  },
  {
    icon: 'hand-back-right' as const,
    text: 'Apply gentle, even pressure — not too hard',
  },
  {
    icon: 'timer-outline' as const,
    text: 'Keep your hand still for 30 seconds',
  },
];

export function DefaultInstructionScreen({ onNext }: SetupScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <MaterialCommunityIcons
                  name={step.icon}
                  size={22}
                  color={colors.primary.blue600}
                />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.text.tertiary}
          />
          <Text style={styles.noteText}>
            Find a comfortable position before starting
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.85}>
          <MaterialCommunityIcons name="heart-pulse" size={20} color={colors.text.inverse} style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Measure My Heart Rate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
    paddingTop: 6,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  noteText: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonIcon: {
    marginRight: 2,
  },
  primaryButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
