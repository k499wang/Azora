import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHeartRateTroubleshooting } from '../../lib/heartRate/captureGuidance';
import type { HeartRateStallIssue } from '../../lib/heartRate/captureStall';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';
import { HeartRatePlacementStepsCard } from './HeartRatePlacementStepsCard';

interface HeartRateHelpSheetProps {
  visible: boolean;
  issue: HeartRateStallIssue;
  cameraTarget: string;
  /** Mirrors the live check underneath, which the sheet covers while it is open. */
  statusMessage: string;
  pulseConfirmed: boolean;
  onDismiss: () => void;
}

export function HeartRateHelpSheet({
  visible,
  issue,
  cameraTarget,
  statusMessage,
  pulseConfirmed,
  onDismiss,
}: HeartRateHelpSheetProps) {
  const insets = useSafeAreaInsets();
  const troubleshooting = getHeartRateTroubleshooting(issue, cameraTarget);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <View style={styles.grabber} />

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                pulseConfirmed && styles.statusDotConfirmed,
              ]}
            />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{troubleshooting.title}</Text>
            <Text style={styles.diagnosis}>{troubleshooting.diagnosis}</Text>
            <HeartRatePlacementStepsCard
              steps={troubleshooting.tips}
              appearance="plain"
            />
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.dismissButtonPressed,
            ]}
          >
            <Text style={styles.dismissText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay.dark,
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background.primary,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: colors.neutral[300],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning[500],
  },
  statusDotConfirmed: {
    backgroundColor: colors.success[500],
  },
  statusText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  diagnosis: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  dismissButton: {
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dismissButtonPressed: {
    opacity: 0.85,
  },
  dismissText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.inverse,
  },
});
