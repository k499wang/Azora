import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import type { OnboardingIntent } from '../../onboarding/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { REFUND_REASSURANCE } from '../../../lib/paywall/paywallReassurance';
import {
  paywallHighlights,
  paywallPlanFacts,
} from '../../../lib/paywall/paywallLongForm';
import PaywallFeatureList from '../PaywallFeatureList';
import { PlanReadySection } from './PlanReadySection';
import { PlanReservedCard } from './PlanReservedCard';
import { TestimonialsSection } from './TestimonialsSection';


interface PaywallLongFormProps {
  name?: string | null;
  /** The goal the plan was built around. */
  intent: OnboardingIntent;
  /** Minutes of the primary daily reset they configured. */
  sessionMinutes: number;
  /**
   * The Free/Pro table, rendered by the caller so this page does not have to
   * know about feature gating. Absent under a hard paywall, where there is no
   * free tier to compare against.
   */
  comparison?: ReactNode;
  /** The trial reminder toggle, which only onboarding's page carries. */
  trialReminder?: ReactNode;
  /** Retry / error block, owned by the screen that knows the purchase state. */
  footerSlot?: ReactNode;
  /** Button placed below the emotional CTA. */
  claimOfferSlot?: ReactNode;
}

/**
 * The long-form sell page, shared by onboarding's paywall and the standalone
 * one so the two surfaces cannot drift into making different promises.
 *
 * The order is the argument: their plan, what it unlocks, what they give up by
 * leaving, and then other people. The price is not on the page at all — it
 * lives in the tray, where the plan cards are the buy control.
 */
export function PaywallLongForm({
  name,
  intent,
  sessionMinutes,
  comparison,
  trialReminder,
  footerSlot,
  claimOfferSlot,
}: PaywallLongFormProps) {
  const facts = useMemo(
    () => paywallPlanFacts(intent, sessionMinutes),
    [intent, sessionMinutes],
  );

  return (
    <View style={styles.page}>
      <PlanReadySection name={name} planDays={facts.planDays} />

      <View style={styles.highlights}>
        <PaywallFeatureList features={paywallHighlights(intent, facts)} />
      </View>

      {comparison ? <View style={styles.slot}>{comparison}</View> : null}

      <View style={styles.slot}>
        <PlanReservedCard />
      </View>

      <TestimonialsSection name={name} />

      {trialReminder ? <View style={styles.slot}>{trialReminder}</View> : null}

      <View style={styles.emotionalCta}>
        <Text style={styles.emotionalCtaText}>Your Journey to a Better You Starts Today.</Text>
      </View>

      {claimOfferSlot ? <View style={styles.claimOffer}>{claimOfferSlot}</View> : null}

      <Text style={styles.reassurance}>{REFUND_REASSURANCE}</Text>

      {footerSlot ? <View style={styles.slot}>{footerSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: spacing.xl,
  },
  slot: {
    marginTop: spacing.lg,
  },
  highlights: {
    paddingTop: spacing['2xl'],
  },
  emotionalCta: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  claimOffer: {
    marginTop: spacing.lg,
  },
  emotionalCtaText: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  reassurance: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
