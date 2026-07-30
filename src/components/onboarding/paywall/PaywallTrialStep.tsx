import { Text } from '../../common/Text';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import Icon, { type IconName } from '../../common/icons/Icon';
import {
  getOnboardingImageSource,
  type OnboardingImageKey,
} from '../../../services/images/onboardingImageCache';
import {
  TESTIMONIAL_CARD_WIDTH,
  paywallStepStyles as styles,
} from './paywallStepStyles';

// Mockup content. Replace with verbatim App Store reviews, real reviewer names,
// and real headshots before shipping — see the note in the paywall PR.
const testimonials: Array<{
  title: string;
  quote: string;
  author: string;
  avatar: OnboardingImageKey;
}> = [
  {
    title: 'I stopped lying awake at 2am',
    quote:
      'My head would not switch off at night. Four minutes of the wind down and I am out before I finish it.',
    author: 'Maya Rivera',
    avatar: 'testimonialMaya',
  },
  {
    title: 'The stress does not stack up now',
    quote:
      'I used to carry every bad meeting into the evening. One reset at my desk and my heart rate is back down before I get home.',
    author: 'Daniel Koch',
    avatar: 'testimonialDaniel',
  },
  {
    title: 'Calmer without adding another hour',
    quote:
      'I do not have time for a long meditation. Five minutes a day and I feel steadier through the whole week.',
    author: 'Priya Shah',
    avatar: 'testimonialPriya',
  },
];

interface TimelineStepProps {
  icon: IconName;
  label: string;
  body: string;
  /** Steps that haven't happened yet read greyed out rather than brand blue. */
  upcoming?: boolean;
  nextIsUpcoming?: boolean;
  showLine?: boolean;
}

function TimelineStep({
  icon,
  label,
  body,
  upcoming = false,
  nextIsUpcoming = false,
  showLine = false,
}: TimelineStepProps) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineIcon, upcoming && styles.timelineIconUpcoming]}>
          <Icon
            name={icon}
            size={24}
            color={upcoming ? colors.text.tertiary : colors.text.inverse}
          />
        </View>
        {showLine ? (
          <View
            style={[
              styles.timelineLine,
              (upcoming || nextIsUpcoming) && styles.timelineLineUpcoming,
            ]}
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

export function PaywallTrialStep({ hasAnnualTrial }: { hasAnnualTrial: boolean }) {
  const steps: Array<Omit<TimelineStepProps, 'showLine'>> = hasAnnualTrial
    ? [
        {
          icon: 'check',
          label: 'Join Azora',
          body: 'You’ve successfully created your personalized plan.',
        },
        {
          icon: 'unlock',
          label: 'Today: Get Premium Access',
          body: 'Unlock exclusive access to heart insights, unlimited sessions, and your full plan.',
        },
        {
          icon: 'bell',
          label: 'Day 6: Trial Reminder',
          body: 'We’ll remind you the day before your trial ends, so nothing catches you off guard.',
          upcoming: true,
        },
        {
          icon: 'star',
          label: 'Day 7: Your Trial Ends',
          body: 'Your membership begins and your subscription starts from there on out.',
          upcoming: true,
        },
      ]
    : [
        {
          icon: 'check',
          label: 'Join Azora',
          body: 'You’ve successfully created your personalized plan.',
        },
        {
          icon: 'unlock',
          label: 'Today: Get Premium Access',
          body: 'Unlock exclusive access to heart insights, unlimited sessions, and your full plan.',
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
            <>
              We want you to try <Text style={styles.stepTitleBrand}>Azora</Text> for
              free
            </>
          ) : (
            'Pro, on your terms'
          )}
        </Text>
        {hasAnnualTrial ? null : (
          <Text style={styles.stepSubtitle}>
            Cancel anytime, no questions asked.
          </Text>
        )}
      </View>
      <View style={[styles.timeline, !hasAnnualTrial && styles.timelineNoTrial]}>
        {steps.map((step, index) => (
          <TimelineStep
            key={step.label}
            {...step}
            nextIsUpcoming={steps[index + 1]?.upcoming ?? false}
            showLine={index < steps.length - 1}
          />
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={TESTIMONIAL_CARD_WIDTH + spacing.sm}
        snapToAlignment="start"
        style={styles.testimonialScroll}
        contentContainerStyle={styles.testimonialRow}
      >
        {testimonials.map((testimonial) => (
          <View key={testimonial.author} style={styles.testimonialCard}>
            <View style={styles.testimonialRating}>
              <View style={styles.testimonialStars}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <Icon key={index} name="star" size={20} color={colors.orange[500]} />
                ))}
              </View>
              <Text style={styles.testimonialRatingValue}>5.0</Text>
            </View>
            <Text style={styles.testimonialTitle}>{testimonial.title}</Text>
            <Text style={styles.testimonialQuote}>{testimonial.quote}</Text>
            <View style={styles.testimonialAttribution}>
              <Image
                source={getOnboardingImageSource(testimonial.avatar)}
                style={styles.testimonialAvatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
                accessibilityLabel={`${testimonial.author} profile photo`}
              />
              <Text style={styles.testimonialAuthor}>{testimonial.author}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default PaywallTrialStep;
