import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  describeRestingHeartRate,
  restingHeartRateGaugeFill,
  type RestingHeartRateBand,
  type RestingHeartRateSex,
} from '../../../lib/restingHeartRate';
import type { GenderOption } from '../data/genderOptions';
import type { CompletedOnboardingBaselineResult } from '../types';
import { scaleVisual } from '../onboardingVisualScale';

interface BaselineHeartRateResultProps {
  result: CompletedOnboardingBaselineResult;
  /** The rate is read against the person's own age and sex, so both are inputs
   *  rather than decoration on the number. */
  age: number;
  gender: GenderOption['id'] | null;
  stepIndex: number;
  stepCount: number;
  onBack: () => void;
  onContinue: () => void;
}

const GAUGE_SIZE = scaleVisual(250);
const GAUGE_STROKE = scaleVisual(12);
const GAUGE_CX = GAUGE_SIZE / 2;
const GAUGE_CY = GAUGE_SIZE / 2;
const GAUGE_R = GAUGE_SIZE / 2 - GAUGE_STROKE / 2 - 8;
const GAUGE_START = 135;
const GAUGE_SWEEP = 270;
const GAUGE_TICK_INNER = GAUGE_R - GAUGE_STROKE / 2 - 6;
const GAUGE_TICK_OUTER = GAUGE_R - GAUGE_STROKE / 2 - 2;
const GAUGE_INNER_R = GAUGE_R - GAUGE_STROKE / 2 - 14;

function gaugeTickPath(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = Skia.Path.Make();
  p.moveTo(GAUGE_CX + GAUGE_TICK_INNER * cos, GAUGE_CY + GAUGE_TICK_INNER * sin);
  p.lineTo(GAUGE_CX + GAUGE_TICK_OUTER * cos, GAUGE_CY + GAUGE_TICK_OUTER * sin);
  return p;
}

const GAUGE_RECT = Skia.XYWHRect(
  GAUGE_CX - GAUGE_R,
  GAUGE_CY - GAUGE_R,
  GAUGE_R * 2,
  GAUGE_R * 2,
);

const GAUGE_TRACK_PATH = (() => {
  const p = Skia.Path.Make();
  p.addArc(GAUGE_RECT, GAUGE_START, GAUGE_SWEEP);
  return p;
})();

const GAUGE_TICK_PATHS = [0, 25, 50, 75, 100].map((t) =>
  gaugeTickPath(GAUGE_START + (t / 100) * GAUGE_SWEEP),
);

/** A rate inside its own range is not a warning, so the dial takes the band's
 *  own colour rather than one fixed accent. */
const BAND_COLOR: Record<RestingHeartRateBand, string> = {
  below: colors.success[500],
  typical: colors.primary.blue500,
  above: colors.warning[500],
};

function toSex(gender: GenderOption['id'] | null): RestingHeartRateSex {
  if (gender === 'female' || gender === 'male') return gender;
  return 'unspecified';
}

/** The measured rate, drawn straight onto the dial. */
function gaugeArcPath(fill: number) {
  const ratio = Math.max(0, Math.min(1, fill / 100));
  const p = Skia.Path.Make();
  if (ratio > 0) {
    p.addArc(GAUGE_RECT, GAUGE_START, GAUGE_SWEEP * ratio);
  }
  return p;
}

export default function BaselineHeartRateResult({
  result,
  age,
  gender,
  stepIndex,
  stepCount,
  onBack,
  onContinue,
}: BaselineHeartRateResultProps) {
  const avgBpm = result.avgBpm;
  // Where this number sits for this person, not for an average adult: the same
  // 72 bpm is unremarkable at 60 and worth a nudge at 25.
  const context = describeRestingHeartRate({
    bpm: avgBpm,
    age,
    sex: toSex(gender),
  });
  const bandColor = BAND_COLOR[context.band];
  // The reading was just taken on the previous screen, so the result lands
  // whole: no sweep up the dial and no counting number, which would restate
  // information the user is already waiting on.
  const arcPath = gaugeArcPath(restingHeartRateGaugeFill(avgBpm));

  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton label="Continue" onPress={onContinue} />
      }
    >
      <View style={styles.gaugeStage}>
        <Text style={styles.gaugeHeading}>Your baseline</Text>
        <Text style={[styles.gaugeSub, { color: bandColor }]}>
          {context.bandLabel}
        </Text>

        <View style={styles.gaugeSurface}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Path
              path={GAUGE_TRACK_PATH}
              style="stroke"
              strokeWidth={GAUGE_STROKE}
              strokeCap="round"
              color={colors.neutral[100]}
            />
            <Path
              path={arcPath}
              style="stroke"
              strokeWidth={GAUGE_STROKE}
              strokeCap="round"
              color={bandColor}
            />
            {GAUGE_TICK_PATHS.map((p, i) => (
              <Path
                key={i}
                path={p}
                style="stroke"
                strokeWidth={1.5}
                strokeCap="round"
                color={colors.neutral[200]}
              />
            ))}
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY + 3}
              r={GAUGE_INNER_R + 3}
              color="rgba(15,23,42,0.04)"
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY + 1.5}
              r={GAUGE_INNER_R + 1.5}
              color="rgba(15,23,42,0.02)"
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY}
              r={GAUGE_INNER_R + 1}
              color={colors.neutral[200]}
            />
            <Circle
              cx={GAUGE_CX}
              cy={GAUGE_CY}
              r={GAUGE_INNER_R}
              color={colors.background.elevated}
            />
          </Canvas>

          <View style={styles.gaugeCenter} pointerEvents="none">
            <View style={styles.gaugeValueRow}>
              <Text style={styles.gaugeValue}>{avgBpm}</Text>
              <Text style={styles.gaugeValueMax}>bpm</Text>
            </View>
          </View>
        </View>

        <View style={styles.gaugeMeta}>
          <Text style={styles.range}>
            Typical for {context.peerLabel}: {context.typicalLow}–
            {context.typicalHigh} bpm
          </Text>
          <Text style={styles.followup}>{context.detail}</Text>
          <Text style={styles.followup}>
            We’ll use this baseline to help you notice changes over time.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  gaugeStage: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  gaugeHeading: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  gaugeSub: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    marginTop: -spacing.lg,
  },
  gaugeSurface: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    position: 'relative',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  gaugeCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValueRow: {
    alignItems: 'center',
  },
  gaugeValue: {
    fontFamily: fonts.semibold,
    fontSize: 76,
    lineHeight: 80,
    letterSpacing: -1.5,
    color: colors.text.primary,
  },
  gaugeValueMax: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    letterSpacing: -0.2,
    marginTop: -spacing.xs,
  },
  gaugeMeta: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  range: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  followup: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
