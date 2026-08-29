import { Text } from '../../common/Text';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon, { type IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { paywallStepStyles as styles } from './paywallStepStyles';

const ICON_SIZE = 22;

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
 * unrelated events. It fades out at the foot instead of stopping square: an
 * end-stop says the relationship ends on billing day, which is the opposite of
 * what the last step is telling them.
 */
function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View style={styles.timeline}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          colors.primary.blue600,
          colors.primary.blue600,
          colors.success[300],
          colors.paywall.trialRailTail,
        ]}
        locations={[0, 0.7, 0.9, 1]}
        style={styles.timelineRail}
      />

      {steps.map((step, index) => (
        <View
          key={step.label}
          style={[
            styles.timelineRow,
            index === steps.length - 1 && styles.timelineRowLast,
          ]}
        >
          <View style={styles.timelineIconSlot}>
            <Icon name={step.icon} size={ICON_SIZE} color={colors.neutral[0]} />
          </View>
          <View style={styles.timelineCopy}>
            <Text style={styles.timelineLabel}>{step.label}</Text>
            <Text style={styles.timelineBody}>{step.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PaywallTrialStep({
  hasAnnualTrial,
  trialLabel,
}: {
  hasAnnualTrial: boolean;
  trialLabel?: string | null;
}) {
  const trialDuration = trialLabel?.replace(/\s+free trial$/i, '') ?? '7-day';
  const trialDurationLabel = trialDuration.replace(/-/g, ' ');
  const trialDays = Number.parseInt(trialDuration, 10);
  const billingDay = Number.isFinite(trialDays) && trialDays > 1 ? trialDays : 7;
  const reminderDays = billingDay - 1;
  const steps: TimelineStep[] = hasAnnualTrial
    ? [
        {
          label: 'Day 1: Today',
          body: 'Unlock all app features like heart insights and unlimited sessions.',
          icon: 'sparkle',
        },
        {
          label: `Day ${reminderDays}: Reminder`,
          body: "We'll send you a reminder that your trial is ending soon.",
          icon: 'message',
        },
        {
          label: `Day ${billingDay}: Billing starts`,
          body: "You'll be charged unless you cancel anytime before.",
          icon: 'calendar',
        },
      ]
    : [
        {
          label: 'Today',
          body: 'Unlock all app features like heart insights and unlimited sessions.',
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

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {hasAnnualTrial ? (
            <>Your <Text style={styles.stepTitleBrand}>{trialDurationLabel} Free</Text> Trial</>
          ) : (
            'Pro, on your terms'
          )}
        </Text>
      </View>
      <Timeline steps={steps} />
    </View>
  );
}

export default PaywallTrialStep;
