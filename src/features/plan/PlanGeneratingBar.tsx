/**
 * The bar that runs while a plan is being started.
 *
 * It fills in three beats rather than sliding at a constant rate: a linear bar
 * is a countdown, and a bar that advances in steps reads as stages of work
 * finishing. Nothing here is measured against the actual insert — see
 * `PLAN_GENERATING_MS` for why the wait exists at all — so the honest thing is
 * to make it a paced reveal rather than a progress report it cannot give.
 *
 * It never sits at full: the last beat lands as the screen flips to the plan
 * itself, so the bar is not left declaring it finished on a screen that has
 * not changed.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ProgressBar from '../../components/common/ProgressBar';
import { PLAN_GENERATING_MS } from './domain/planStart';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** Three beats, evenly spaced across the wait. */
const STAGES = [0.36, 0.7, 1] as const;
const STAGE_MS = PLAN_GENERATING_MS / STAGES.length;
const BAR_HEIGHT = 10;

export default function PlanGeneratingBar() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= STAGES.length - 1) return;

    const timer = setTimeout(() => setStage((current) => current + 1), STAGE_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <View
      style={styles.bar}
      accessibilityRole="progressbar"
      accessibilityLabel="Generating your plan"
    >
      <Text style={styles.label}>Generating your plan</Text>
      <ProgressBar
        progress={STAGES[stage]}
        from={0}
        delay={0}
        height={BAR_HEIGHT}
        trackColor={colors.background.primary}
        fillColor={colors.playful.sky.base}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  label: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
