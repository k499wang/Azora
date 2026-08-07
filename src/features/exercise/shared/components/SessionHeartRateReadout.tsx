import { Text } from '../../../../components/common/Text';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signalHint } from '../../shared/components/ExerciseHeartRateGuidance';
import type {
  FingerPlacementState,
  SignalStatus,
} from '../../../../lib/heartRate/types';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';
import { padding, spacing } from '../../../../theme/spacing';
import { fonts, typography } from '../../../../theme/typography';

interface SessionHeartRateReadoutProps {
  theme: ExerciseDarkTheme;
  bpm: number | null;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
}

/**
 * What is left of the heart-rate UI once the pulse is locked: the number, and a
 * warning loud enough to act on. The graph and preview have done their job by
 * this point and would only compete with the character.
 */
export default function SessionHeartRateReadout({
  theme,
  bpm,
  fingerPlacement,
  signalStatus,
}: SessionHeartRateReadoutProps) {
  const signalGood =
    fingerPlacement === 'good' &&
    (signalStatus === 'measuring' || signalStatus === 'warming_up');

  return (
    <View style={styles.container} pointerEvents="none">
      {signalGood ? null : (
        <View style={styles.warningRow}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color={colors.warning[500]}
          />
          <Text style={styles.warningText}>
            {signalHint(signalStatus, fingerPlacement)}
          </Text>
        </View>
      )}

      <View style={styles.bpmRow}>
        <MaterialCommunityIcons
          name="heart"
          size={20}
          color={theme.textAccent}
        />
        <Text style={[styles.bpm, { color: theme.textPrimary }]}>
          {bpm == null ? '--' : Math.round(bpm)}
        </Text>
        <Text style={[styles.unit, { color: theme.textSecondary }]}>BPM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  warningText: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: colors.warning[500],
    textAlign: 'center',
    flexShrink: 1,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  bpm: {
    ...typography.display.display3,
  },
  unit: {
    ...typography.label.medium,
    letterSpacing: 1,
  },
});
