import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../common/Text';
import type { PresetId } from '../../lib/onboardingPreset';
import type { ReportAnswerSummaryItem } from '../../lib/onboardingReport';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { OnboardingIllustrationName } from '../common/icons/onboardingIllustrationCatalog';
import OnboardingOptionIcon from './OnboardingOptionIcon';

export type PlanRevealPhase = 'diagnosis' | 'plan';

type PlayfulHue = keyof Pick<
  typeof colors.playful,
  'teal' | 'coral' | 'violet' | 'sky' | 'blush' | 'night'
>;

export const PLAN_HUE: Record<PresetId, PlayfulHue> = {
  night: 'night',
  morning: 'coral',
  pressure: 'blush',
  focus: 'violet',
  quiet: 'sky',
  home: 'teal',
  phone: 'violet',
  recovery: 'teal',
  selfTrust: 'sky',
};

const TILE_ICON_SIZE = 32;
const INSIGHT_ICON_SIZE = 36;
const SUMMARY_ICON_SIZE = 42;

const SUMMARY_ICONS: Record<ReportAnswerSummaryItem['id'], OnboardingIllustrationName> = {
  goal: 'target',
  routine: 'file-document-outline',
  rest: 'bed-outline',
  focus: 'mood-focus',
  starting: 'rocket-launch',
};

/**
 * Both phases' versions are always laid out, one over the other, and only
 * faded. The block takes the taller one's height, so it keeps its size through
 * the swap and everything below it holds still.
 */
export function PhaseSwap({
  phase,
  views,
  style,
}: {
  phase: PlanRevealPhase;
  views: Record<PlanRevealPhase, ReactNode>;
  style?: StyleProp<ViewStyle>;
}) {
  const [heights, setHeights] = useState<Record<PlanRevealPhase, number>>({
    diagnosis: 0,
    plan: 0,
  });
  const reducedMotion = useReducedMotion();
  const shown = useSharedValue(phase === 'plan' ? 1 : 0);

  useEffect(() => {
    const to = phase === 'plan' ? 1 : 0;
    shown.value = reducedMotion
      ? to
      : withTiming(to, { duration: duration.slow, easing: easing.enter });
  }, [phase, reducedMotion, shown]);

  const diagnosisStyle = useAnimatedStyle(() => ({ opacity: 1 - shown.value }));
  const planStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

  return (
    <View style={[{ minHeight: Math.max(heights.diagnosis, heights.plan) }, style]}>
      {(['diagnosis', 'plan'] as const).map((viewPhase) => {
        const hidden = viewPhase !== phase;
        return (
          <Animated.View
            key={viewPhase}
            style={[styles.overlaid, viewPhase === 'plan' ? planStyle : diagnosisStyle]}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setHeights((current) =>
                current[viewPhase] === height ? current : { ...current, [viewPhase]: height },
              );
            }}
            accessibilityElementsHidden={hidden}
            importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
          >
            {views[viewPhase]}
          </Animated.View>
        );
      })}
    </View>
  );
}

interface IdentityProps {
  phase: PlanRevealPhase;
  hue: PlayfulHue;
  views: Record<PlanRevealPhase, { eyebrow: string; name: string; line: string }>;
}

export function ReportIdentity({ phase, hue, views }: IdentityProps) {
  return (
    <View style={styles.identity}>
      <PhaseSwap
        phase={phase}
        style={styles.identityCopySlot}
        views={{
          diagnosis: <IdentityCopy {...views.diagnosis} hue={hue} />,
          plan: <IdentityCopy {...views.plan} hue={hue} />,
        }}
      />
    </View>
  );
}

function IdentityCopy({ eyebrow, name, line, hue }: {
  eyebrow: string;
  name: string;
  line: string;
  hue: PlayfulHue;
}) {
  const tone = colors.playful[hue];
  return (
    <View style={styles.identityCopy}>
      <View style={[styles.identityEyebrowPill, { backgroundColor: tone.soft }]}>
        <Text style={[styles.identityEyebrow, { color: tone.ink }]}>{eyebrow}</Text>
      </View>
      <Text style={styles.identityName}>{name}</Text>
      <Text style={styles.identityLine}>{line}</Text>
    </View>
  );
}

export interface ReportTile {
  label: string;
  value: string;
  icon: OnboardingIllustrationName;
  hue: PlayfulHue;
}

export function ReportTiles({ tiles }: { tiles: readonly ReportTile[] }) {
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => {
        const tone = colors.playful[tile.hue];
        return (
          <View
            key={tile.label}
            style={[
              styles.tile,
              {
                backgroundColor: tone.tint,
                borderColor: tone.mid,
                borderBottomColor: tone.mid,
              },
            ]}
          >
            <View style={styles.tileValueRow}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <OnboardingOptionIcon name={tile.icon} size={TILE_ICON_SIZE} />
              </View>
              <Text style={[styles.tileValue, { color: tone.ink }]}>{tile.value}</Text>
            </View>
            <Text style={[styles.tileLabel, { color: tone.ink }]}>{tile.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** What the answers showed, or what the plan does about it. */
export function ReportInsights({
  heading,
  lines,
  icon,
}: {
  heading: string;
  lines: readonly string[];
  icon: OnboardingIllustrationName;
}) {
  return (
    <View style={styles.insights}>
      <Text style={styles.insightsHeading}>{heading}</Text>
      {lines.map((line) => (
        <View key={line} style={styles.insight}>
          <View
            style={styles.insightIcon}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <OnboardingOptionIcon name={icon} size={INSIGHT_ICON_SIZE} />
          </View>
          <Text style={styles.insightText}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

export function ReportAnswerSummary({ items }: {
  items: readonly ReportAnswerSummaryItem[];
}) {
  return (
    <View style={styles.summary}>
      <Text style={styles.insightsHeading}>Your answers, at a glance</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.summaryRow}>
          <View
            style={styles.summaryIcon}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <OnboardingOptionIcon
              name={SUMMARY_ICONS[item.id]}
              size={SUMMARY_ICON_SIZE}
            />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text style={styles.summaryValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlaid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  identity: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  identityCopySlot: {
    width: '100%',
  },
  identityCopy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  identityEyebrowPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  identityEyebrow: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
  },
  identityName: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  identityLine: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    ...card.lipped,
    flex: 1,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    padding: spacing.sm + spacing.xs,
    alignItems: 'center',
    gap: spacing.xs,
  },
  tileLabel: {
    ...typography.label.detail,
    textAlign: 'center',
  },
  tileValueRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tileValue: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    flexShrink: 1,
  },
  insights: {
    gap: spacing.md,
  },
  insightsHeading: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  insightIcon: {
    width: INSIGHT_ICON_SIZE,
    height: INSIGHT_ICON_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    ...typography.body.medium,
    flex: 1,
    color: colors.text.secondary,
  },
  summary: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  summaryIcon: {
    width: SUMMARY_ICON_SIZE,
    height: SUMMARY_ICON_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  summaryValue: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
