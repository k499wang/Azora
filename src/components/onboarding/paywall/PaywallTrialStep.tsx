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
 * unrelated events. The lower section changes colour at the final milestone
 * so the trial period and its billing boundary stay visually distinct.
 */
function Timeline({
  steps,
  showTrialTail,
}: {
  steps: TimelineStep[];
  showTrialTail: boolean;
}) {
  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;

        return (
          <View
            key={step.label}
            style={[styles.timelineRow, isLast && styles.timelineRowLast]}
          >
            {showTrialTail && isLast ? (
              <LinearGradient
                pointerEvents="none"
                colors={[
                  colors.success[500],
                  colors.success[300],
                  'rgba(123,240,174,0)',
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
          body: 'Your full personalized plan, unlimited exercises and all your health insights.',
          icon: 'lock',
        },
        {
          label: `Day ${reminderDays}: Reminder`,
          body: "We'll send you a reminder that your trial is ending soon.",
          icon: 'bell',
        },
        {
          label: `Day ${billingDay}: Billing starts`,
          body: "You'll be charged unless you cancel anytime before.",
          icon: 'star',
        },
      ]
    : [
        {
          label: 'Day 1: Today',
          body: 'Your full personalized plan, unlimited exercises and all your health insights.',
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
      <Timeline steps={steps} showTrialTail={hasAnnualTrial} />
    </View>
  );
}

export default PaywallTrialStep;
