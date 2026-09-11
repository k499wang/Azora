import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../common/Text';
import ChunkyButton, { CHUNKY_TONE_QUIET } from '../../common/ChunkyButton';
import type { DailyPlanSchedule } from '../../../services/dailyPlan/types';
import { formatDailyPlanTime } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card, radius } from '../../../theme/card';
import { DAILY_REMINDER_DEFINITIONS } from '../../../services/notifications/notificationCatalog';
import { getBackgroundImageSource } from '../../../services/images/backgroundImageCache';
import AzoAside from '../AzoAside';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

interface NotificationPermissionScreenProps {
  schedule: DailyPlanSchedule;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onEnable: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const AVATAR_SIZE = 44;

/**
 * The permission asked as a favour rather than a setting.
 *
 * It used to be three switches and a button that counted them, which put a
 * configuration job in front of someone at the exact moment they were being
 * asked for something. Reminders are one decision — you either want to hear
 * from Mochi or you don't — so the screen asks once, in his voice, and shows
 * the notification it is actually asking permission to send.
 *
 * The preview is built from the user's own plan, not from filler: the hour
 * under it is the hour they set two screens ago, which turns the mockup into a
 * promise and pays back the work they just did.
 */
function NotificationPreview({ schedule }: { schedule: DailyPlanSchedule }) {
  const definition = DAILY_REMINDER_DEFINITIONS[0];
  const time = schedule.actions[definition.scheduleActionId];

  return (
    <View style={styles.preview}>
      {/* The retained decode warmed at startup, drawn with no transition: the
          icon has to be there in the card's first frame, not fade in a beat
          after the screen has settled. */}
      <Image
        source={getBackgroundImageSource('appIcon')}
        style={styles.avatar}
        contentFit="contain"
        transition={0}
        cachePolicy="memory-disk"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.previewCopy}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewFrom}>Azora</Text>
          <Text style={styles.previewTime}>
            {formatDailyPlanTime(time, time)}
          </Text>
        </View>
        <Text style={styles.previewBody}>{definition.content.title}</Text>
      </View>
    </View>
  );
}

export default function NotificationPermissionScreen({
  schedule,
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onEnable,
  onSkip,
  onBack,
}: NotificationPermissionScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <AzoAside
          text="Want me to check in on you?"
          variant="question"
          expression="happy"
          wearing="glasses"
          holding="notes"
          delayMs={160}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody
      footer={
        <View style={styles.footer}>
          <OnboardingPrimaryButton
            label="Yes, check in on me"
            loading={isSubmitting}
            onPress={onEnable}
          />
          {/* Visible rather than a Skip hidden in the top corner: an ask with an
              obvious way out reads as a question, and a question is what this
              screen is. */}
          <ChunkyButton
            label="Maybe later"
            tone={CHUNKY_TONE_QUIET}
            disabled={isSubmitting}
            onPress={onSkip}
            haptic="none"
          />
        </View>
      }
    >
      <View style={styles.content}>
        <NotificationPreview schedule={schedule} />
        <Text style={styles.note}>
          People who turn reminders on are{' '}
          <Text style={styles.noteStrong}>3x more likely</Text> to finish their
          daily plan and stick with it.
        </Text>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  footer: {
    gap: spacing.sm,
  },
  preview: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    padding: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.small,
    borderCurve: 'continuous',
  },
  previewCopy: {
    flex: 1,
    gap: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  previewFrom: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  previewTime: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  previewBody: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
  note: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  noteStrong: {
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  errorText: {
    ...typography.body.small,
    color: colors.error[500],
    textAlign: 'center',
  },
});
