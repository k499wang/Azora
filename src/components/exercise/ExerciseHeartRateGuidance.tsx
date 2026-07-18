import { Text } from '../common/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { FindingPulseHint } from '../heartRate/FindingPulseHint';
import type { FingerPlacementState, SignalStatus } from '../../lib/heartRate/types';
import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ExerciseHeartRateGuidanceProps {
  placementActive: boolean;
  breathingActive: boolean;
  theme: ExerciseDarkTheme;
  active: boolean;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
}

function placementHint(placement: FingerPlacementState): string {
  switch (placement) {
    case 'good':
      return 'Hold still';
    case 'partial':
      return 'Cover the lens fully';
    case 'too_much_pressure':
      return 'Ease up slightly';
    case 'no_finger':
    case 'lost':
    default:
      return 'Rest your fingertip on the camera';
  }
}

function signalHint(status: SignalStatus, placement: FingerPlacementState): string {
  switch (status) {
    case 'excessive_motion':
      return 'Too much movement — keep still';
    case 'no_pulse':
      return 'No pulse — adjust your finger';
    case 'partial_coverage':
      return 'Cover the lens fully';
    case 'too_much_pressure':
      return 'Ease up slightly';
    case 'no_finger':
    case 'signal_lost':
      return 'Rest your fingertip on the camera';
    default:
      return placementHint(placement);
  }
}

interface HeartRatePlacementGuidanceProps {
  theme: ExerciseDarkTheme;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
}

export function HeartRatePlacementGuidance({
  theme,
  fingerPlacement,
  signalStatus,
}: HeartRatePlacementGuidanceProps) {
  if (signalStatus === 'excessive_motion' || signalStatus === 'no_pulse') {
    return (
      <Text style={[styles.hintText, { color: theme.textSecondary }]}>
        {signalHint(signalStatus, fingerPlacement)}
      </Text>
    );
  }

  if (fingerPlacement !== 'good') {
    return (
      <Text style={[styles.hintText, { color: theme.textSecondary }]}>
        {placementHint(fingerPlacement)}
      </Text>
    );
  }

  return (
    <FindingPulseHint
      textStyle={[styles.hintText, { color: theme.textSecondary }]}
    />
  );
}

interface HeartRateSignalWarningProps {
  active: boolean;
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  style?: StyleProp<ViewStyle>;
}

export function HeartRateSignalWarning({
  active,
  fingerPlacement,
  signalStatus,
  style,
}: HeartRateSignalWarningProps) {
  const signalGood =
    fingerPlacement === 'good' &&
    (signalStatus === 'measuring' || signalStatus === 'warming_up');

  if (!active || signalGood) return null;

  return (
    <View style={[styles.warningRow, style]}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={12}
        color={colors.warning[500]}
      />
      <Text style={styles.warningText}>
        {signalHint(signalStatus, fingerPlacement)}
      </Text>
    </View>
  );
}

export function ExerciseHeartRateGuidance({
  placementActive,
  breathingActive,
  theme,
  active,
  fingerPlacement,
  signalStatus,
}: ExerciseHeartRateGuidanceProps) {
  return (
    <View style={styles.container}>
      {placementActive ? (
        <HeartRatePlacementGuidance
          theme={theme}
          fingerPlacement={fingerPlacement}
          signalStatus={signalStatus}
        />
      ) : breathingActive ? (
        <HeartRateSignalWarning
          active={active}
          fingerPlacement={fingerPlacement}
          signalStatus={signalStatus}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 15,
    color: colors.text.secondary,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warningText: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 15,
    letterSpacing: 0.5,
    color: colors.warning[500],
    opacity: 0.85,
  },
});
