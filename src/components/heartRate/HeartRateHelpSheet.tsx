import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Device from 'expo-device';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HeartRateStallIssue } from '../../lib/heartRate/captureStall';
import {
  getHeartRateCameraTarget,
  getHeartRateTroubleshooting,
} from '../../lib/heartRate/captureGuidance';
import { colors } from '../../theme/colors';
import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';
import {
  exerciseHeartRateHelpPalette,
  LIGHT_HEART_RATE_HELP_PALETTE,
} from '../../theme/heartRateHelpPalette';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';
import { HeartRatePlacementIllustration } from './HeartRatePlacementIllustration';
import { HeartRatePlacementStepsCard } from './HeartRatePlacementStepsCard';

interface HeartRateHelpSheetProps {
  visible: boolean;
  /** Mirrors the live check underneath, which the sheet covers while it is open. */
  statusMessage: string;
  pulseConfirmed: boolean;
  /** The fault that stalled the search; decides which advice is shown. */
  issue: HeartRateStallIssue | null;
  onDismiss: () => void;
  /** Set inside a session so the sheet matches the theme it interrupts. */
  theme?: ExerciseDarkTheme;
}

export function HeartRateHelpSheet({
  visible,
  statusMessage,
  pulseConfirmed,
  issue,
  onDismiss,
  theme,
}: HeartRateHelpSheetProps) {
  const insets = useSafeAreaInsets();
  const palette =
    theme == null
      ? LIGHT_HEART_RATE_HELP_PALETTE
      : exerciseHeartRateHelpPalette(theme);

  // A window that never classified anything is the weak-perfusion case, which
  // is what `no_pulse` already advises on.
  const troubleshooting = getHeartRateTroubleshooting(
    issue ?? 'no_pulse',
    getHeartRateCameraTarget(Device.modelName, Device.modelId),
  );

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
          style={[
            styles.sheet,
            {
              backgroundColor: palette.sheet,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View
            style={[styles.statusRow, { backgroundColor: palette.statusSurface }]}
          >
            <View
              style={[
                styles.statusDot,
                pulseConfirmed && styles.statusDotConfirmed,
              ]}
            />
            <Text style={[styles.statusText, { color: palette.detail }]}>
              {statusMessage}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.title, { color: palette.title }]}>
              {troubleshooting.title}
            </Text>
            <Text style={[styles.diagnosis, { color: palette.detail }]}>
              {troubleshooting.diagnosis}
            </Text>
            <View style={styles.illustrationWrap}>
              <HeartRatePlacementIllustration compact palette={palette} />
            </View>
            <HeartRatePlacementStepsCard
              steps={troubleshooting.tips}
              appearance="plain"
              palette={palette}
            />
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.dismissButton,
              { backgroundColor: palette.buttonSurface },
              pressed && styles.dismissButtonPressed,
            ]}
          >
            <Text style={[styles.dismissText, { color: palette.buttonText }]}>
              Got it
            </Text>
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
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 999,
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
    flex: 1,
  },
  content: {
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
  },
  diagnosis: {
    ...typography.body.small,
    paddingBottom: spacing.xs,
  },
  illustrationWrap: {
    width: '82%',
    alignSelf: 'center',
  },
  dismissButton: {
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dismissButtonPressed: {
    opacity: 0.85,
  },
  dismissText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
  },
});
