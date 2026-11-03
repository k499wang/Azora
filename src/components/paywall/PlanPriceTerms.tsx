import { StyleSheet } from 'react-native';
import type { PaywallPackageOption } from '../../services/paywall';
import { computePerMonth } from '../../lib/paywall/planPrice';
import { trialDaysFromLabel } from '../../lib/paywall/trialReminder';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';

interface Props {
  pkg: PaywallPackageOption;
}

/** "Redeem 7 days free, then $39.99/year ($3.33/mo)." under the purchase button. */
export function PlanPriceTerms({ pkg }: Props) {
  const perMonth = pkg.billingPeriod === 'year' ? computePerMonth(pkg) : null;
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
      <Text style={styles.bold}>{`${pkg.priceString}/${pkg.billingPeriod}`}</Text>
      {perMonth != null ? ` (${perMonth}/mo)` : ''}
      .
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
});
