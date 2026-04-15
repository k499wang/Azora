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

export function ContextInstructionScreen({ onNext, onCancel }: SetupScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="chart-line"
              size={48}
              color={colors.primary.blue600}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Baseline Check</Text>

        {/* Explanation */}
        <View style={styles.card}>
          <Text style={styles.explanation}>
            You're about to measure your{' '}
            <Text style={styles.highlight}>baseline heart rate</Text> before this session.
          </Text>
          <Text style={styles.explanation}>
            We'll compare it to your reading after to show how your breathing practice
            affected your heart rate.
          </Text>
          <View style={styles.divider} />
          <View style={styles.bulletRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.bulletText}>Takes about 15 seconds</Text>
          </View>
          <View style={styles.bulletRow}>
            <MaterialCommunityIcons name="flash" size={16} color={colors.text.secondary} />
            <Text style={styles.bulletText}>Uses camera flash — best in dim light</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Start Measuring</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.7}
            style={styles.skipTouchable}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  explanation: {
    ...typography.body.medium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  highlight: {
    color: colors.primary.blue600,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulletText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  spacer: {
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
  skipTouchable: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
