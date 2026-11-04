import { StyleSheet } from 'react-native';
import type { PaywallPackageOption } from '../../services/paywall';
import { computeDiscountPercent, computePerMonth, formatCurrencyLike } from '../../lib/paywall/planPrice';
import { trialDaysFromLabel } from '../../lib/paywall/trialReminder';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';

interface Props {
  pkg: PaywallPackageOption;
  largePrice?: boolean;
}

/** Trial and recurring price summary for the selected plan. */
export function PlanPriceTerms({ pkg, largePrice = false }: Props) {
  const perMonth = pkg.billingPeriod === 'year' ? computePerMonth(pkg) : null;
  const savingsPercent = pkg.billingPeriod === 'year'
      ? computeDiscountPercent({ ...pkg, priceCents: 12000 }, pkg)
      : null;
  const comparisonPerYear = savingsPercent != null && savingsPercent > 0
      ? formatCurrencyLike(pkg.priceString, 120)
      : null;
  const trial = pkg.trialLabel != null
    ? `${pkg.trialDays ?? trialDaysFromLabel(pkg.trialLabel)} days free`
    : pkg.introOffer != null
      ? `${pkg.introOffer.days} days for ${pkg.introOffer.priceString}`
      : null;

  return (
    <Text style={styles.terms}>
      {trial != null ? (
        <>
          {'Redeem '}
          {trial}
          {', then '}
        </>
      ) : null}
      {comparisonPerYear != null ? (
        <>
          <Text style={styles.comparison}>{comparisonPerYear}</Text>
          {' '}
        </>
      ) : null}
      <Text style={[
        pkg.billingPeriod === 'year' && styles.yearlyPrice,
        (largePrice || (pkg.trialLabel == null && pkg.introOffer != null)) && styles.largePrice,
      ]}>{pkg.priceString}</Text>
      {` per ${pkg.billingPeriod}`}
      {perMonth != null ? ` (${perMonth}/mo)` : ''}
      {savingsPercent != null && savingsPercent > 0 ? (
        <>
          {' '}
          {`Save ${savingsPercent}%`}
          {'.'}
        </>
      ) : '.'}
      {pkg.trialLabel == null && pkg.introOffer != null && !(savingsPercent != null && savingsPercent > 0) ? ' Cancel anytime.' : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  terms: {
    ...typography.body.small,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  yearlyPrice: {
    fontSize: 17,
  },
  largePrice: {
    fontSize: 17,
  },
  comparison: {
    fontSize: 17,
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
});
