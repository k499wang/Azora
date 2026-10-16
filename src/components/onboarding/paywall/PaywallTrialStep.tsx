import { Text } from '../../common/Text';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon, { type IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { scaleControl } from '../onboardingVisualScale';
import { paywallStepStyles as styles } from './paywallStepStyles';
import { PaywallSection } from '../../paywall/longForm/PaywallSection';

const ICON_SIZE = scaleControl(22);
const STEP_ICON_SIZE = scaleControl(22);

interface TimelineStep {
  label: string;
  body: string;
  icon: IconName;
}

/**
 * The trial as one continuous rail.
 *
 * The rail runs behind all three icons rather than joining separate dots,
 * because the trial is a single stretch of time — three dots read as three
 * unrelated events. The lower section changes colour at the final milestone
 * so the trial period and its billing boundary stay visually distinct.
 */
function Timeline({
  steps,
  showTrialTail,
  layout,
}: {
  steps: TimelineStep[];
  showTrialTail: boolean;
  layout: 'step' | 'section';
}) {
  return (
    <View style={[styles.timeline, layout === 'section' && styles.timelineSection, layout === 'step' && styles.timelineStep]}>
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;

        if (layout === 'step') {
          return (
            <View key={step.label} style={[styles.timelineStepRow, isLast && styles.timelineStepRowLast]}>
              {!isLast ? <View pointerEvents="none" style={styles.timelineStepRail} /> : null}
              <View style={[styles.timelineStepIcon, isFirst && styles.timelineStepIconFirst]}>
                <Icon name={step.icon} size={STEP_ICON_SIZE} color={isFirst ? colors.neutral[0] : colors.primary.blue700} />
              </View>
              <View style={styles.timelineStepCopy}>
                <Text style={styles.timelineStepLabel}>{step.label}</Text>
                <Text style={styles.timelineStepBody}>{step.body}</Text>
              </View>
            </View>
          );
        }

        return (
          <View
            key={step.label}
            style={[styles.timelineRow, isLast && styles.timelineRowLast]}
          >
            {showTrialTail && isLast ? (
              <LinearGradient
                pointerEvents="none"
                colors={[
                  colors.success[300],
                  colors.success[100],
                  'rgba(214,251,228,0)',
                ]}
                locations={[0, 0.5, 1]}
                style={styles.timelineRailTail}
              />
            ) : null}
            <View
              pointerEvents="none"
              style={[
                styles.timelineRailSegment,
                isFirst && styles.timelineRailSegmentFirst,
                !isLast && styles.timelineRailSegmentBridge,
                isLast &&
                  (showTrialTail
                    ? styles.timelineRailCap
                    : styles.timelineRailSegmentLast),
              ]}
            />
            <View style={styles.timelineIconSlot}>
              <Icon name={step.icon} size={ICON_SIZE} color={colors.neutral[0]} />
            </View>
            <View style={styles.timelineCopy}>
              <Text style={styles.timelineLabel}>{step.label}</Text>
              <Text style={styles.timelineBody}>{step.body}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function PaywallTrialStep({
  hasAnnualTrial,
  trialLabel,
  paidTrial,
  layout = 'step',
}: {
  hasAnnualTrial: boolean;
  trialLabel?: string | null;
  /** The selected plan's paid intro trial, which replaces the free trial's timeline. */
  paidTrial?: { days: number; introPrice: string; renewalPrice: string } | null;
  variant?: 'pro' | 'onboarding';
  /**
   * `step` inside the trial deck, `section` on the long-form page, where the
   * timeline is one of the page's sections and takes its heading from here.
   */
  layout?: 'step' | 'section';
}) {
  const trialDuration = trialLabel?.replace(/\s+free trial$/i, '') ?? '7-day';
  const trialDays = paidTrial?.days ?? Number.parseInt(trialDuration, 10);
  const billingDay = Number.isFinite(trialDays) && trialDays > 1 ? trialDays : 7;
  const reminderDays = Math.max(billingDay - 2, 1);
  const steps: TimelineStep[] = paidTrial != null && layout === 'step'
    ? [
        {
          label: 'Today: Instant access',
          body: `With ${paidTrial.days}-day trial for ${paidTrial.introPrice}`,
          icon: 'lock',
        },
        {
          label: `Day ${reminderDays}: Trial reminder`,
          body: 'We notify you about your trial end. Turn it on below.',
          icon: 'bell',
        },
        {
          label: `Day ${billingDay}: Full membership`,
          body: `Your account is charged ${paidTrial.renewalPrice}/month, cancel anytime in the 24h before`,
          icon: 'star',
        },
      ]
    : hasAnnualTrial
    ? [
        {
          label: layout === 'step' ? 'Today: Instant access' : 'Day 1: Today',
          body: layout === 'step'
            ? `With free ${trialDuration} trial`
            : 'Get your full plan and every exercise, starting now.',
          icon: 'lock',
        },
        {
          label: layout === 'step' ? `Day ${reminderDays}: Trial reminder` : `Day ${reminderDays}: Reminder`,
          body: layout === 'step'
            ? 'We notify you about your trial end. Turn it on below.'
            : "We'll send you a reminder that your trial is ending soon.",
          icon: 'bell',
        },
        {
          label: layout === 'step' ? `Day ${billingDay}: Full membership` : `Day ${billingDay}: Billing starts`,
          body: layout === 'step'
            ? 'Your account is charged, cancel anytime in the 24h before'
            : "You'll be charged unless you cancel anytime before.",
          icon: 'star',
        },
      ]
    : [
        {
          label: 'Day 1: Today',
          body: 'Get your full plan and every exercise, starting now.',
          icon: 'sparkle',
        },
        {
          label: 'Anytime',
          body: 'Change or cancel your plan whenever you want.',
          icon: 'clock',
        },
        {
          label: 'Welcome back',
          body: 'Your past progress and insights stay with you.',
          icon: 'journal',
        },
      ];

  if (layout === 'section') {
    return (
      <PaywallSection title="How Your Personalized Plan Works" singleLineTitle>
        <Timeline steps={steps} showTrialTail={hasAnnualTrial} layout="section" />
      </PaywallSection>
    );
  }

  return (
    <View style={styles.stepContainer}>
      <View style={styles.trialDesignHeader}>
        <Text style={styles.trialDesignTitle}>{hasAnnualTrial ? 'Design your trial experience' : 'Choose your plan'}</Text>
      </View>
      <Timeline steps={steps} showTrialTail={hasAnnualTrial} layout="step" />
    </View>
  );
}

export default PaywallTrialStep;
