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
   * free tier to compare against. It arrives as a section, so it carries its
   * own top spacing like every other section on the page.
   */
  comparison?: ReactNode;
  /**
   * How the plan works, as a section: the trial's billing timeline when there
   * is a trial, day-one-and-onward when there is not. Rendered by the caller so
   * this page does not have to know how a plan bills.
   */
  howItWorks?: ReactNode;
  /**
   * The trial reminder toggle. It renders directly under the timeline, because
   * it is the control for the reminder the timeline promises.
   */
  trialReminder?: ReactNode;
  /** Retry / error block, owned by the screen that knows the purchase state. */
  footerSlot?: ReactNode;
  /** Button placed above the closing line, so the last thing read is the promise. */
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
  howItWorks,
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

      {howItWorks}

      {trialReminder ? (
        <View style={styles.timelineReminder}>{trialReminder}</View>
      ) : null}

      {comparison}

      <View style={styles.slot}>
        <PlanReservedCard />
      </View>

      <TestimonialsSection name={name} />

      {claimOfferSlot ? <View style={styles.claimOffer}>{claimOfferSlot}</View> : null}

      <View
        style={[styles.emotionalCta, claimOfferSlot == null && styles.emotionalCtaSpacing]}
      >
        <Text style={styles.emotionalCtaText}>Your Journey to a Better You Starts Today.</Text>
      </View>

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
  // Tighter than a section gap on purpose: the toggle belongs to the timeline
  // above it, so it groups with that block rather than starting a new one.
  timelineReminder: {
    marginTop: spacing.md,
  },
  highlights: {
    paddingTop: spacing['2xl'],
  },
  emotionalCta: {
    alignItems: 'center',
  },
  // Only needed when there is no claim button above: that block owns the gap
  // between itself and the closing line.
  emotionalCtaSpacing: {
    marginTop: spacing.xl,
  },
  // Centred in the space it sits in — the argument above it and the closing
  // line below it are both the same distance away, so it owns both gaps.
  claimOffer: {
    marginTop: spacing['2xl'],
    marginBottom: spacing['2xl'],
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
