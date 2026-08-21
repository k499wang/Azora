import { Text } from '../../common/Text';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors } from '../../../theme/colors';
import { paywallStepStyles as styles } from './paywallStepStyles';

type TimelineIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TimelineStepProps {
  label: string;
  body: string;
  icon: TimelineIconName;
  /** Steps that haven't happened yet read greyed out rather than brand blue. */
  upcoming?: boolean;
  showLine?: boolean;
  /** Trailing stub on the final step — the timeline runs on past the last card. */
  showTail?: boolean;
}

function TimelineStep({
  label,
  body,
  icon,
  upcoming = false,
  showLine = false,
  showTail = false,
}: TimelineStepProps) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, upcoming && styles.timelineDotUpcoming]}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.neutral[0]} />
        </View>
        {showLine ? (
          <View
            style={[styles.timelineLine, upcoming && styles.timelineLineUpcoming]}
          />
        ) : null}
        {showTail ? (
          <View
            style={[
              styles.timelineTail,
              upcoming && styles.timelineLineUpcoming,
            ]}
          />
        ) : null}
      </View>
      <View style={[styles.timelineCopy, showLine && styles.timelineCopySpaced]}>
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
          label: 'Day 1: Today',
          body: 'Unlock all app exercises like heart insights and your personalized plan.',
          icon: 'lock-open-variant',
        },
        {
          label: `Day ${reminderDays}: Reminder`,
          body: "We'll send you a reminder that your trial is ending soon.",
          icon: 'bell',
          upcoming: true,
        },
        {
          label: `Day ${billingDay}: Billing starts`,
          body: "You'll be charged unless you cancel anytime before.",
          icon: 'credit-card',
          upcoming: true,
        },
      ]
    : [
        {
          label: 'Today',
          body: 'Unlock all app exercises like heart insights and your personalized plan.',
          icon: 'lock-open-variant',
        },
        {
          label: 'Anytime',
          body: 'Change or cancel your plan whenever you want, no questions asked.',
          icon: 'calendar',
        },
        {
          label: 'Welcome back',
          body: 'Your past progress and insights stay with you whenever you return.',
          icon: 'heart',
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
            showTail={index === steps.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

export default PaywallTrialStep;
