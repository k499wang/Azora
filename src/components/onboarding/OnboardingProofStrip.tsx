import { Text } from '../common/Text';
import { StyleSheet, View } from 'react-native';
import HarvardLogo from '../../../assets/logos/harvard.svg';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  FEEL_BETTER_DAYS,
  FEEL_BETTER_PERCENT,
  IMPROVED_HABITS_PERCENT,
} from '../../data/socialProof';

const HEADLINE_HEIGHT = 56;
/** The shield alone, cropped from the full wordmark logo. */
const HARVARD_SHIELD_VIEWBOX = '0 8 133 149';
const HARVARD_SHIELD_ASPECT = 133 / 149;

export default function OnboardingProofStrip() {
  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <HarvardLogo
          width={HEADLINE_HEIGHT * HARVARD_SHIELD_ASPECT}
          height={HEADLINE_HEIGHT}
          viewBox={HARVARD_SHIELD_VIEWBOX}
        />
        <Text style={styles.caption}>Built on peer-reviewed habit research</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.stat}>{IMPROVED_HABITS_PERCENT}%</Text>
        <Text style={styles.caption}>of members report approaching habits better</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.stat}>{FEEL_BETTER_PERCENT}%</Text>
        <Text style={styles.caption}>
          of members report feeling better after {FEEL_BETTER_DAYS} days
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stat: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    lineHeight: HEADLINE_HEIGHT,
    color: colors.text.primary,
  },
  caption: {
    ...typography.body.small,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
