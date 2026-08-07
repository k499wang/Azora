import { Text } from '../../../../components/common/Text';
import { StyleSheet } from 'react-native';
import { FindingPulseHint } from '../../../../components/heartRate/FindingPulseHint';
import type { FingerPlacementState, SignalStatus } from '../../../../lib/heartRate/types';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { colors } from '../../../../theme/colors';
import { fonts } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';

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

export function signalHint(
  status: SignalStatus,
  placement: FingerPlacementState,
): string {
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

const styles = StyleSheet.create({
  hintText: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 15,
    color: colors.text.secondary,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
