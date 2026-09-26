import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';

interface PlanReadySectionProps {
  outcome: string;
  finishLine: string;
}

const AZO_SIZE = 200;

export function PlanReadySection({ outcome, finishLine }: PlanReadySectionProps) {
  return (
    <View style={styles.container}>
      <Image
        source={getOnboardingImageSource('azoGiftKoala')}
        style={styles.azo}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        transition={0}
        accessible={false}
      />
      <Text style={styles.title}>{outcome}</Text>
      <Text style={styles.finishLine}>{finishLine}</Text>
      <View style={styles.priceComparison}>
        <Text style={styles.priceText}>Only $1.54/week</Text>
        <Text style={styles.priceDivider}>·</Text>
        <Text style={styles.priceText}>50x cheaper than therapy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  azo: {
    width: AZO_SIZE,
    height: AZO_SIZE,
  },
  title: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  finishLine: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priceText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  priceDivider: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
});
