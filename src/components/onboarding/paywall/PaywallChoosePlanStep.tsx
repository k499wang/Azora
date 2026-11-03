import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type {
  PaywallPackageId,
  PaywallPackageOption,
  PaywallPlanPicker,
} from '../../../services/paywall';
import { colors } from '../../../theme/colors';
import { card } from '../../../theme/card';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { Text } from '../../common/Text';
import { PlanCard } from '../../paywall/PlanCard';
import { PaywallCheckLine } from '../../paywall/PaywallCheckLine';
import { computePerMonth } from '../../../lib/paywall/planPrice';
import { trialDaysFromLabel } from '../../../lib/paywall/trialReminder';
import { paywallStepStyles as styles } from './paywallStepStyles';

interface PaywallChoosePlanStepProps {
  isLoading: boolean;
  annualPackage: PaywallPackageOption | undefined;
  monthlyPackage: PaywallPackageOption | undefined;
  selectedPackageId: PaywallPackageId;
  onSelectPackage: (packageId: PaywallPackageId) => void;
  savingsPercent: number | null;
  planPicker: PaywallPlanPicker;
  /** The trial reminder toggle sits above, already spacing the cards from the timeline. */
  followsReminder: boolean;
}

const PERIOD_NAME = { year: 'Yearly', month: 'Monthly', week: 'Weekly' } as const;

function trialDays(pkg: PaywallPackageOption): number {
  return pkg.trialDays ?? trialDaysFromLabel(pkg.trialLabel);
}

export function PaywallChoosePlanStep({
  isLoading,
  annualPackage,
  monthlyPackage,
  selectedPackageId,
  onSelectPackage,
  savingsPercent,
  planPicker,
  followsReminder,
}: PaywallChoosePlanStepProps) {
  const packages = [annualPackage, monthlyPackage].filter(
    (pkg): pkg is PaywallPackageOption => pkg != null,
  );

  return (
    <View style={styles.choosePlanContainer}>
      {isLoading ? (
        <View style={[styles.cardsLoading, !followsReminder && styles.planCardsNoTrial]}>
          <ActivityIndicator color={colors.primary.blue500} />
        </View>
      ) : planPicker === 'stacked' ? (
        <View style={[styles.planCardsStacked, !followsReminder && styles.planCardsNoTrial]}>
          {annualPackage ? (
            <View style={styles.annualCard}>
              <PlanCard
                pkg={annualPackage}
                isSelected={selectedPackageId === 'annual'}
                onSelect={onSelectPackage}
                savingsPercent={savingsPercent}
                comparePerMonth={monthlyPackage ? computePerMonth(monthlyPackage) : null}
                light
                layout="full-width"
                balanced
              />
            </View>
          ) : null}
          {monthlyPackage ? (
            <View style={styles.monthlyCard}>
              <PlanCard
                pkg={monthlyPackage}
                isSelected={selectedPackageId === 'monthly'}
                onSelect={onSelectPackage}
                savingsPercent={null}
                light
                layout="full-width"
                balanced
              />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[local.block, !followsReminder && styles.planCardsNoTrial]}>
          <View style={local.row}>
            {packages.map((pkg) => (
              <OptionCard
                key={pkg.id}
                pkg={pkg}
                isSelected={pkg.id === selectedPackageId}
                onSelect={onSelectPackage}
              />
            ))}
          </View>
          <PaywallCheckLine label="No commitment, cancel anytime" />
        </View>
      )}
    </View>
  );
}

interface OptionCardProps {
  pkg: PaywallPackageOption;
  isSelected: boolean;
  onSelect: (packageId: PaywallPackageId) => void;
}

function OptionCard({ pkg, isSelected, onSelect }: OptionCardProps) {
  const intro = pkg.introOffer;
  const title = pkg.trialLabel != null ? 'Free' : intro?.priceString ?? pkg.priceString;
  const detail = pkg.trialLabel != null
    ? `${trialDays(pkg)}-Day Trial`
    : intro != null
      ? `${intro.days}-Day Trial`
      : PERIOD_NAME[pkg.billingPeriod];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelect(pkg.id)}
      style={({ pressed }) => [
        local.card,
        isSelected && local.cardSelected,
        pressed && local.pressed,
      ]}
    >
      <Text style={[local.title, isSelected && local.titleSelected]}>{title}</Text>
      <Text style={local.detail}>{detail}</Text>
      {isSelected ? (
        <View style={local.check} pointerEvents="none">
          <View style={local.checkDot} />
        </View>
      ) : null}
    </Pressable>
  );
}

const CHECK_SIZE = 24;
const CHECK_OVERHANG = 8;

const local = StyleSheet.create({
  block: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    // Room for the check that sits on the selected card's corner.
    paddingTop: CHECK_OVERHANG,
  },
  card: {
    ...card.base,
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + spacing.xs,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    backgroundColor: colors.background.card,
  },
  cardSelected: {
    borderColor: colors.primary.blue500,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  titleSelected: {
    color: colors.primary.blue500,
  },
  detail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  check: {
    position: 'absolute',
    top: -CHECK_OVERHANG,
    right: -CHECK_OVERHANG,
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary.blue500,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDot: {
    width: CHECK_SIZE / 2,
    height: CHECK_SIZE / 2,
    borderRadius: CHECK_SIZE / 4,
    backgroundColor: colors.primary.blue500,
  },
});

export default PaywallChoosePlanStep;
