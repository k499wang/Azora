import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
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
    text: 'Keep your hand still for 15 seconds',
  },
];

export function DefaultInstructionScreen({ onNext, onCancel }: SetupScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={56}
              color={colors.primary.blue600}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Measure Heart Rate</Text>
        <Text style={styles.subtitle}>
          Using your phone's camera and flash to detect your pulse
        </Text>

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

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>I'm Ready</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.cancelTouchable}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
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
  actions: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
  cancelTouchable: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
