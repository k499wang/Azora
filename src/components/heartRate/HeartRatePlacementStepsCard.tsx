import { StyleSheet, View } from 'react-native';
import type { HeartRatePlacementStep } from '../../lib/heartRate/captureGuidance';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';

// Apple's inset-grouped cells sit as flat white surfaces on the grey canvas;
// separators start after the leading icon/number, not at the card edge.
const DIVIDER_INSET = 26 + spacing.md; // number circle width + row gap

interface HeartRatePlacementStepsCardProps {
  steps: readonly HeartRatePlacementStep[];
  appearance?: 'card' | 'plain';
  textSize?: 'default' | 'large';
}

export function HeartRatePlacementStepsCard({
  steps,
  appearance = 'card',
  textSize = 'default',
}: HeartRatePlacementStepsCardProps) {
  const isPlain = appearance === 'plain';
  const hasLargeText = textSize === 'large';

  return (
    <View
      style={[
        !isPlain && card.base,
        !isPlain && styles.surface,
        styles.container,
        isPlain && styles.plain,
      ]}
    >
      {steps.map((step, index) => (
        <View key={step.title} style={styles.cell}>
          {index > 0 ? (
            <View
              style={[
                styles.divider,
                !isPlain && styles.dividerInset,
              ]}
            />
          ) : null}
          <View style={styles.row}>
            <View style={styles.number}>
              <Text style={styles.numberText}>{index + 1}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, hasLargeText && styles.titleLarge]}>
                {step.title}
              </Text>
              <Text style={[styles.detail, hasLargeText && styles.detailLarge]}>
                {step.detail}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  surface: {
    backgroundColor: colors.background.elevated,
  },
  plain: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  cell: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
  },
  dividerInset: {
    left: DIVIDER_INSET,
  },
  number: {
    flexShrink: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue700,
    textAlign: 'center',
    includeFontPadding: false,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'left',
  },
  titleLarge: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  detail: {
    ...typography.body.xsmall,
    color: colors.text.secondary,
  },
  detailLarge: {
    ...typography.body.small,
  },
});
