import { Text } from '../../common/Text';
import { View } from 'react-native';
import { colors } from '../../../theme/colors';
import Icon, { type IconName } from '../../common/icons/Icon';
import { paywallStepStyles as styles } from './paywallStepStyles';

interface TimelineStepProps {
  icon: IconName;
  label: string;
  body: string;
  /** Steps that haven't happened yet read greyed out rather than brand blue. */
  upcoming?: boolean;
  showLine?: boolean;
}

function TimelineStep({
  icon,
  label,
  body,
  upcoming = false,
  showLine = false,
}: TimelineStepProps) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineIcon, upcoming && styles.timelineIconUpcoming]}>
          <Icon
            name={icon}
            size={20}
            color={upcoming ? colors.text.tertiary : colors.neutral[0]}
          />
        </View>
        {showLine ? (
          <View
            style={[styles.timelineLine, upcoming && styles.timelineLineUpcoming]}
          />
        ) : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineBody}>{body}</Text>
      </View>
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
  const steps: Array<Omit<TimelineStepProps, 'showLine'>> = hasAnnualTrial
    ? [
        {
          icon: 'unlock',
          label: 'Day 1: Today',
          body: 'Unlock all app exercises like heart insights and your personalized plan.',
        },
        {
          icon: 'bell',
          label: `Day ${reminderDays}: Reminder`,
          body: "We'll send you a reminder that your trial is ending soon.",
          upcoming: true,
        },
        {
          icon: 'star',
          label: `Day ${billingDay}: Billing starts`,
          body: "You'll be charged unless you cancel anytime before.",
          upcoming: true,
        },
      ]
    : [
        {
          icon: 'unlock',
          label: 'Today',
          body: 'Unlock all app exercises like heart insights and your personalized plan.',
        },
        {
          icon: 'timer',
          label: 'Anytime',
          body: 'Change or cancel your plan whenever you want, no questions asked.',
        },
        {
          icon: 'heart',
          label: 'Welcome back',
          body: 'Your past progress and insights stay with you whenever you return.',
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
      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <TimelineStep
            key={step.label}
            {...step}
            showLine={index < steps.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

export default PaywallTrialStep;
