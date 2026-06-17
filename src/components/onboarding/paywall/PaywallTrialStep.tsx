import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import Icon, { type IconName } from '../../common/icons/Icon';
import { paywallStepStyles as styles } from './paywallStepStyles';

interface TimelineStepProps {
  icon: IconName;
  label: string;
  body: string;
  iconColor?: string;
  lineColor?: string;
  showLine?: boolean;
}

function TimelineStep({
  icon,
  label,
  body,
  iconColor = colors.primary.blue600,
  lineColor = colors.primary.blue100,
  showLine = false,
}: TimelineStepProps) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineIcon, { backgroundColor: iconColor }]}>
          <Icon name={icon} size={20} color={colors.text.inverse} />
        </View>
        {showLine ? (
          <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />
        ) : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineBody}>{body}</Text>
      </View>
    </View>
  );
}

export function PaywallTrialStep({ hasAnnualTrial }: { hasAnnualTrial: boolean }) {
  const steps: Array<Omit<TimelineStepProps, 'showLine'>> = hasAnnualTrial
    ? [
        {
          icon: 'sparkle',
          label: 'Today',
          body: 'Unlock all of the app’s features instantly, with every Pro tool ready to use right away.',
        },
        {
          icon: 'bell',
          label: 'In 6 Days — Reminder',
          body: 'We’ll send you a reminder that your trial is ending soon, as long as you’ve allowed us to notify you.',
          lineColor: colors.neutral[300],
        },
        {
          icon: 'star',
          label: 'In 7 Days — Billing Starts',
          body: 'You’ll be charged when your free trial ends, unless you cancel anytime before then.',
          iconColor: colors.neutral[900],
        },
      ]
    : [
        {
          icon: 'sparkle',
          label: 'Today',
          body: 'Subscribe now to unlock every Pro feature instantly and start practicing right away.',
        },
        {
          icon: 'timer',
          label: 'Anytime',
          body: 'Manage or cancel your plan in App Store settings whenever you want, no questions asked.',
        },
        {
          icon: 'heart',
          label: 'Welcome back',
          body: 'All of your past progress and insights stay with you, ready whenever you return.',
        },
      ];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {hasAnnualTrial ? 'Free to try, fully cancellable' : 'Pro, on your terms'}
        </Text>
        <Text style={styles.stepSubtitle}>
          {hasAnnualTrial
            ? "You won't be charged until your trial ends."
            : 'Cancel anytime in App Store settings — no questions asked.'}
        </Text>
        {hasAnnualTrial ? (
          <Text style={styles.stepFinePrint}>Make sure your notifications are on.</Text>
        ) : null}
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
