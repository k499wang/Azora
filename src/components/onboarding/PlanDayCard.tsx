import { StyleSheet, View } from 'react-native';
import { JOURNEY_MARKS } from '../paywall/PaywallPlanJourney';
import { Text } from '../common/Text';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, scaleType, typography } from '../../theme/typography';
import OnboardingOptionIcon from './OnboardingOptionIcon';
import { scaleControl } from './onboardingVisualScale';

const ICON_SIZE = scaleControl(44);

interface PlanDayCardProps {
  title: string;
  line: string;
  /** The card's place in its list, which sets its side and its picture. */
  index: number;
  /** For titles long enough to wrap, like a day plus its lesson name. */
  smallTitle?: boolean;
}

/** One day of the plan; a list of them zigzags down the screen. */
export default function PlanDayCard({ title, line, index, smallTitle = false }: PlanDayCardProps) {
  const mark = JOURNEY_MARKS[index % JOURNEY_MARKS.length];
  return (
    <View style={[styles.card, index % 2 === 0 ? styles.left : styles.right]}>
      <OnboardingOptionIcon name={mark.icon} size={ICON_SIZE} color={mark.hue.ink} />
      <View style={styles.copy}>
        <Text style={[styles.title, smallTitle && styles.smallTitle]}>{title}</Text>
        <Text style={styles.line}>{line}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    width: '90%',
  },
  left: {
    alignSelf: 'flex-start',
  },
  right: {
    alignSelf: 'flex-end',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.heading.heading1,
    fontSize: scaleType(20),
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  smallTitle: {
    fontSize: typography.heading.heading1.fontSize,
  },
  line: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
