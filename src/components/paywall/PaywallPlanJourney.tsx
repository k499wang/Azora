import { StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from '../common/Text';
import PlanJourney, { type PlanJourneyStop } from '../onboarding/PlanJourney';
import type { personalizedPaywallPlan } from '../../lib/paywall/paywallLongForm';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { PaywallSection } from './longForm/PaywallSection';

/** A picture and hue per stop, in order along the journey. */
const JOURNEY_MARKS = [
  { icon: 'walk', hue: colors.playful.teal },
  { icon: 'breath-leaf', hue: colors.playful.sky },
  { icon: 'streak', hue: colors.playful.coral },
  { icon: 'calendar-check-outline', hue: colors.playful.violet },
  { icon: 'target', hue: colors.playful.amber },
  { icon: 'star', hue: colors.playful.teal },
] as const;

export function PaywallPlanJourney({
  plan,
  title = `Your journey to ${plan.planName}`,
  titleStyle,
  style,
}: {
  plan: ReturnType<typeof personalizedPaywallPlan>;
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  const journey: PlanJourneyStop[] = plan.stops.map((stop, index) => {
    const { icon, hue } = JOURNEY_MARKS[index % JOURNEY_MARKS.length];
    const milestone = plan.milestones.find(({ day }) => day === stop.day);
    return {
      day: stop.day,
      title: stop.day === 1 ? 'One small step' : milestone?.title,
      line: stop.line,
      icon,
      accent: hue.ink,
      backgroundColor: hue.soft,
    };
  });

  return (
    <PaywallSection title={title} titleStyle={titleStyle} style={style}>
      <PlanJourney stops={journey} cardWidth={0.86} />
      <Text style={styles.paceNote}>
        Miss a day? Your plan waits for you.
      </Text>
    </PaywallSection>
  );
}

const styles = StyleSheet.create({
  paceNote: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
