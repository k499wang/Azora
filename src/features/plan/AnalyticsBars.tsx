/**
 * The two charts the analytics card is made of.
 *
 * Both are bars because both questions are about magnitude, and both are
 * directly labelled because a chart of four numbers does not need an axis to
 * read them off. There is no legend: with two bars named on their own rows and
 * a diverging chart split by a labelled midline, identity is never carried by
 * colour alone.
 *
 * The diverging pair is teal and coral, warm against cool, with a neutral
 * midline — never red and green. A hard day is not an error state, and the
 * pair has to survive colour-blindness, which red/green does not.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import type { FactorEffect } from './domain/moodAnalytics';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const BAR_HEIGHT = 26;
const FACTOR_BAR_HEIGHT = 18;
/** The widest an effect bar may draw, as a share of its half. */
const FACTOR_FULL_SCALE = 1.5;

export const ANALYTICS_UP = colors.playful.teal;
export const ANALYTICS_DOWN = colors.playful.coral;

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

interface ComparisonBarsProps {
  /** Two rows, drawn against the same 0–1 scale so their lengths compare. */
  rows: Array<{ key: string; label: string; share: number; strong: boolean }>;
}

/**
 * Two bars on one scale.
 *
 * A pie of two slices or a pair of donuts would both be harder to compare than
 * two bars sharing a left edge, which is the whole question here.
 */
export function ComparisonBars({ rows }: ComparisonBarsProps) {
  return (
    <View style={styles.comparison}>
      {rows.map((row) => {
        const hue = row.strong ? ANALYTICS_UP : ANALYTICS_DOWN;

        return (
          <View key={row.key} style={styles.comparisonRow}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(row.share, 0.02) * 100}%`,
                    backgroundColor: hue.tint,
                  },
                ]}
              />
              {/* On the bar, not after it: the number is the thing being
                  compared, so it travels with the length that means it. */}
              <Text style={[styles.rowValue, { color: hue.ink }]}>
                {percent(row.share)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

interface FactorBarsProps {
  better: FactorEffect[];
  harder: FactorEffect[];
}

/**
 * A diverging chart: better days to the right of the user's own average,
 * harder days to the left, with the midline drawn as the anchor.
 *
 * Sorted by strength within each side, so the eye reads the longest bar first
 * and the list has an order rather than an arrangement.
 */
export function FactorBars({ better, harder }: FactorBarsProps) {
  const factors = [...better, ...harder];

  return (
    <View style={styles.factors}>
      {factors.map((factor) => {
        const up = factor.effect > 0;
        const hue = up ? ANALYTICS_UP : ANALYTICS_DOWN;
        const share = Math.min(Math.abs(factor.effect) / FACTOR_FULL_SCALE, 1);

        return (
          <View key={factor.tagId} style={styles.factorRow}>
            <Text style={styles.factorLabel} numberOfLines={1}>
              {factor.label}
            </Text>

            <View style={styles.plot}>
              {/* The zero line is the user's own average day. Everything on
                  this chart is measured from it, so it is drawn rather than
                  implied. */}
              <View style={styles.midline} />

              <View style={styles.half}>
                {up ? null : (
                  <View
                    style={[
                      styles.factorFill,
                      styles.factorFillLeft,
                      { width: `${share * 100}%`, backgroundColor: hue.tint },
                    ]}
                  />
                )}
              </View>
              <View style={styles.half}>
                {up ? (
                  <View
                    style={[
                      styles.factorFill,
                      styles.factorFillRight,
                      { width: `${share * 100}%`, backgroundColor: hue.tint },
                    ]}
                  />
                ) : null}
              </View>
            </View>

            <Text style={[styles.factorValue, { color: hue.ink }]}>
              {up ? '+' : '−'}
              {Math.abs(factor.effect).toFixed(1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  comparison: {
    gap: spacing.sm,
  },
  comparisonRow: {
    gap: spacing.xs,
  },
  rowLabel: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
  track: {
    height: BAR_HEIGHT,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    borderRadius: radius.small,
    borderCurve: 'continuous',
  },
  rowValue: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    paddingHorizontal: spacing.sm,
  },
  factors: {
    gap: spacing.xs,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  factorLabel: {
    ...typography.label.detail,
    color: colors.text.secondary,
    width: 74,
  },
  plot: {
    flex: 1,
    flexDirection: 'row',
    height: FACTOR_BAR_HEIGHT,
    alignItems: 'center',
  },
  midline: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  half: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
  },
  factorFill: {
    height: '100%',
    borderRadius: radius.xs,
    borderCurve: 'continuous',
  },
  // Grown from the midline outwards, so both sides start where zero is.
  factorFillLeft: {
    marginLeft: 'auto',
  },
  factorFillRight: {
    marginRight: 'auto',
  },
  factorValue: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
