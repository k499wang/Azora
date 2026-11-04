import { StyleSheet } from 'react-native';
import type { PaywallPackageOption } from '../../services/paywall';
import { computeAnnualSavings, computePerMonth, computePerYear } from '../../lib/paywall/planPrice';
import { trialDaysFromLabel } from '../../lib/paywall/trialReminder';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';

interface Props {
  pkg: PaywallPackageOption;
  comparisonPackage?: PaywallPackageOption;
}

/** Trial and recurring price summary for the selected plan. */
export function PlanPriceTerms({ pkg, comparisonPackage }: Props) {
  const perMonth = pkg.billingPeriod === 'year' ? computePerMonth(pkg) : null;
  const savingsPercent = perMonth != null && comparisonPackage != null
    && pkg.currencyCode === comparisonPackage.currencyCode
      ? computeAnnualSavings(pkg, comparisonPackage)
      : null;
  const comparisonPerYear = comparisonPackage != null && savingsPercent != null && savingsPercent > 0
      ? computePerYear(comparisonPackage)
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
          <Text style={styles.bold}>{trial}</Text>
          {', then '}
        </>
      ) : null}
      {comparisonPerYear != null ? (
        <>
          <Text style={styles.comparison}>{comparisonPerYear}</Text>
          {' '}
        </>
      ) : null}
      <Text style={styles.bold}>{`${pkg.priceString} per ${pkg.billingPeriod}`}</Text>
      {perMonth != null ? ` (${perMonth}/mo)` : ''}
      {savingsPercent != null && savingsPercent > 0 ? (
        <>
          {' '}
          <Text style={styles.bold}>{`(Save ${savingsPercent}%)`}</Text>
          {'.'}
        </>
      ) : '.'}
      {pkg.trialLabel == null && pkg.introOffer != null ? ' Cancel anytime.' : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  terms: {
    ...typography.body.small,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  bold: {
    fontFamily: fonts.heavy,
  },
  comparison: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
});
