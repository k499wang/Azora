import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LessonScreenProps } from '../app/navigation';
import { useAfterScreenClosed } from '../app/navigation/useAfterScreenClosed';
import { Text } from '../components/common/Text';
import ChunkyButton from '../components/common/ChunkyButton';
import CloseButton from '../components/common/CloseButton';
import ProgressBar, { STEP_PROGRESS } from '../components/common/ProgressBar';
import ScreenContent from '../components/common/ScreenContent';
import RewardAnimationPreload from '../features/plan/RewardAnimationPreload';
import LessonBlockView, {
  FeedEntrance,
  isLessonActivity,
} from '../features/lessons/LessonBlockView';
import { handDayCompleteToHome } from '../features/room/homeDayCompleteHandoff';
import { useCloseOntoHome } from '../app/navigation/useCloseOntoHome';
import { takeForcedDayComplete } from '../features/room/devDayCompleteOverride';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { isLastUnfinishedDayUnit } from '../hooks/dayUnits/dayUnit';
import { hasPieceToEarn } from '../lib/room/roomProgress';
import {
  LESSON_REVISION,
  lessonById,
  usesPracticalLessonSequence,
  type LessonBlock,
} from '../features/lessons/domain/lessonCatalogue';
import { lessonPages } from '../features/lessons/domain/lessonPages';
import { lessonActivityId } from '../features/lessons/domain/lessonActivity';
import { EARN_RATES } from '../lib/wallet/coins';
import { useTodayProgramDay } from '../hooks/useTodayProgramDay';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useRecordLessonReadMutation } from '../queries/lessons/useRecordLessonReadMutation';
import {
  trackLessonOpened,
  trackLessonRead,
} from '../services/analytics/tracking';
import { useFirstWinOfDay } from '../features/selfCare/useFirstWinOfDay';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useTourStore } from '../features/tour/tourStore';
import { useAuthStore } from '../stores/authStore';
import { triggerSoftHaptic, triggerTapHaptic } from '../native/tapHaptics';
import {
  actionForNextProgramDay,
  saveLessonAction,
  type LessonActionFollowUp,
} from '../services/lessons/lessonActionFollowUp';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const TITLE_SIZE = 34;
const TITLE_LINE_HEIGHT = 41;
const TITLE_SIZE_COMPACT = 29;
const TITLE_LINE_HEIGHT_COMPACT = 35;
/**
 * A short phone, where the title line has the least room. The title drops a
 * size rather than the body, because a claim is the one thing still legible
 * five points smaller.
 */
const COMPACT_HEIGHT = 700;

/**
 * The day's lesson, as a Stories-style feed.
 *
 * One line at a time, added on Continue. A daily lesson that arrives as a page
 * of text is a page somebody has to decide to read, every day, before the thing
 * they came to do — and on the days they are busiest it is the decision that
 * goes. A line at a time, at a size you can read standing up, gives a longer
 * lesson a manageable rhythm, and what came before stays above to look back on.
 *
 * Questions hold Continue until they are answered, and the closing thought is
 * the last line, so it cannot be skipped past.
 *
 * In development, Lesson Lab can select an authored lesson by id. That path
 * renders the same feed without recording activity or triggering rewards.
 */
export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const program = useTodayProgramDay(userId);
  const day = program.day;
  const previewLessonId = __DEV__ ? route.params?.previewLessonId : undefined;
  const isPreview = previewLessonId != null;
  const supportsLessonFollowUp = !isPreview && day != null &&
    !usesPracticalLessonSequence(day.enrollment.planId, day.enrollment.presetRevision);
  const lesson = previewLessonId != null
    ? lessonById(previewLessonId)
    : day?.lesson ?? null;
  const alreadyRead =
    !isPreview && lesson != null &&
    day?.completedActivityIds.includes(lessonActivityId(lesson.id)) === true;

  // The title is the first line: the claim, alone, before the argument for it.
  const pages = lesson == null ? [] : lessonPages(lesson.blocks);
  const itemCount = pages.length + 1;
  const [revealed, setRevealed] = useState(1);
  const reducedMotion = useReducedMotion();
  const feed = useRef<ScrollView>(null);
  const [choiceSelections, setChoiceSelections] = useState<Record<number, number>>({});
  const [completedActivities, setCompletedActivities] = useState<Record<number, boolean>>({});
  const [previousAction, setPreviousAction] = useState<LessonActionFollowUp | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState<'tried' | 'adapted' | 'later' | null>(null);
  const hasPreviousAction = supportsLessonFollowUp && previousAction != null;
  const record = useRecordLessonReadMutation(userId);
  const firstWin = useFirstWinOfDay(userId);
  const readToEnd = useRef(false);
  const roomClaim = useRoomClaim(userId);
  const lessonUnit = roomClaim.dailies.units.find(
    (unit) => unit.kind === 'lesson',
  );
  const closeOntoHome = useCloseOntoHome(navigation);
  const handedToReward = useRef(false);

  // Opened from the tour's last stop, this is where the tour ends — and only
  // once the lesson is off the screen: ending it earlier would release the
  // one-time offer onto the closing lesson, ahead of the streak popup and the
  // confetti it is owed. Every way out counts; only reading to the end earns
  // the confetti. A lesson that earned coins hands both to the reward screen
  // that replaces it.
  useAfterScreenClosed(navigation, () => {
    if (isPreview || handedToReward.current) return;
    useTourStore.getState().endHandoff(readToEnd.current);
    useFirstWinOfDayStore.getState().revealAfterClose();
  });

  useEffect(() => {
    if (lesson == null || isPreview) return;
    trackLessonOpened({ lessonId: lesson.id, alreadyRead });
    // Opening is the event. Re-rendering because the read landed is not a
    // second open, so this watches the lesson rather than what is known of it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  useEffect(() => {
    setPreviousAction(null);
    setFollowUpResponse(null);
    if (!supportsLessonFollowUp || userId == null || day == null) return;
    let active = true;
    actionForNextProgramDay(userId, day.enrollment.enrollmentId, day.programDay)
      .then((action) => { if (active) setPreviousAction(action); })
      .catch(() => {});
    return () => { active = false; };
  }, [supportsLessonFollowUp, userId, day?.enrollment.enrollmentId, day?.programDay]);

  /**
   * Done closes, and the write runs behind it.
   *
   * Nothing on the way out waits for the server: the row on Home is drawn from
   * the day's completions, and the mutation seeds that list itself. A spinner
   * here would sit on the end of a lesson somebody has just finished, which is
   * the one moment they are done with this screen.
   *
   * A write that fails leaves the lesson unread and openable again, which is
   * the honest outcome — better than a tick for something we did not record.
   */
  const finish = () => {
    if (isPreview) {
      navigation.goBack();
      return;
    }
    readToEnd.current = true;
    // A lesson already read today is a win already counted, so this only
    // claims on a re-read when the dev preview forces it.
    const firstWinEarned = lesson != null && firstWin.claim();
    if (firstWinEarned) {
      useFirstWinOfDayStore.getState().show({ heldForClose: true });
    }
    if (lesson != null && !alreadyRead) {
      trackLessonRead({ lessonId: lesson.id, revision: LESSON_REVISION });
      const action = lesson.blocks.findLast((block) => block.kind === 'do');
      record
        .mutateAsync({
          lessonId: lesson.id,
          revision: LESSON_REVISION,
          localDate: todayLocalDate,
          enrollmentId: day?.enrollment.enrollmentId ?? null,
        })
        .then(() => {
          if (supportsLessonFollowUp && action?.kind === 'do' && userId != null && day != null) {
            saveLessonAction(userId, day.enrollment.enrollmentId, {
              lessonId: lesson.id,
              actionText: action.text,
              programDay: day.programDay,
            }).catch(() => {});
          }
        })
        .catch(() => {
          if (firstWinEarned) firstWin.withdraw();
        });
    }
    // The last thing the day asked for celebrates over Home when it earns a
    // piece — after the coins, when the read earned some.
    const dayCompleteUnitId =
      lessonUnit != null &&
      ((isLastUnfinishedDayUnit(roomClaim.dailies.units, lessonUnit.id) &&
        hasPieceToEarn(roomClaim.progress)) ||
        takeForcedDayComplete())
        ? lessonUnit.id
        : undefined;
    if (lesson != null && !alreadyRead) {
      handedToReward.current = true;
      navigation.replace('ActivityReward', {
        kind: 'lesson',
        coins: EARN_RATES.lessonOrCheckIn,
        dayCompleteUnitId,
      });
      return;
    }
    // The lesson gets out of the way at once rather than sliding off first.
    if (dayCompleteUnitId != null) {
      handDayCompleteToHome(dayCompleteUnitId);
      closeOntoHome();
      return;
    }
    navigation.goBack();
  };

  const titleStyle = height < COMPACT_HEIGHT ? styles.titleCompact : null;

  const isAnswered = (block: LessonBlock, page: number) =>
    block.kind === 'choice' || block.kind === 'do'
      ? choiceSelections[page] != null
      : completedActivities[page] === true;
  const currentPage = revealed - 2;
  const currentBlock = pages[currentPage];
  const isLastItem = revealed >= itemCount;
  const waiting = currentBlock != null && isLessonActivity(currentBlock) && !isAnswered(currentBlock, currentPage);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <RewardAnimationPreload pose="excited" enabled={!isPreview && lesson != null && !alreadyRead} />
      <View style={styles.header}>
        <CloseButton onPress={() => navigation.goBack()} />
        <View style={styles.progress}>
          <ProgressBar
            {...STEP_PROGRESS}
            progress={lesson == null ? 1 : revealed / itemCount}
          />
        </View>
        {/* Balances the close button so the bar sits centred. */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={feed}
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        // Every new line lands at the bottom; the feed follows it into view.
        onContentSizeChange={() => feed.current?.scrollToEnd({ animated: !reducedMotion })}
      >
        <ScreenContent width="grouped" style={styles.feedBody}>
          {lesson == null ? (
            <FeedEntrance>
              {/* A day past the end of a plan. The only row that opens this
                  exists on a day that has a lesson, so this is a race with
                  midnight rather than a state worth apologising for. */}
              <Text style={[styles.title, titleStyle]}>Nothing to read today.</Text>
            </FeedEntrance>
          ) : (
            <>
              <FeedEntrance style={styles.titleItem}>
                <Text style={[styles.title, titleStyle]}>{lesson.title}</Text>
                {hasPreviousAction && previousAction != null ? (
                  <View style={styles.followUp}>
                    <Text style={styles.followUpLabel}>A quick look back</Text>
                    <Text style={styles.followUpQuestion}>How did the last lesson’s step go?</Text>
                    <Text style={styles.followUpAction}>{previousAction.actionText.replace(/\*\*/g, '')}</Text>
                    <View style={styles.followUpOptions}>
                      {([
                        ['tried', 'I tried it'],
                        ['adapted', 'I adapted it'],
                        ['later', 'Not yet'],
                      ] as const).map(([value, label]) => (
                        <Pressable
                          key={value}
                          onPress={() => { triggerTapHaptic(); setFollowUpResponse(value); }}
                          accessibilityRole="button"
                          accessibilityLabel={label}
                          accessibilityState={{ selected: followUpResponse === value }}
                          style={[styles.followUpOption, followUpResponse === value && styles.followUpOptionSelected]}
                        >
                          <Text style={styles.followUpOptionText}>{label}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {followUpResponse != null ? (
                      <Text style={styles.followUpFeedback} accessibilityLiveRegion="polite">
                        {followUpResponse === 'tried'
                          ? 'Notice what helped, even if it was only a small part.'
                          : followUpResponse === 'adapted'
                            ? 'Adjusting a step to fit your day is useful practice.'
                            : 'That is okay. You can try a smaller version when it fits.'}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </FeedEntrance>
              {pages.slice(0, revealed - 1).map((block, page) => (
                <FeedEntrance key={page}>
                  <LessonBlockView
                    block={block}
                    selectedOption={choiceSelections[page]}
                    onSelectOption={(index) => {
                      if (choiceSelections[page] != null) return;
                      triggerSoftHaptic();
                      setChoiceSelections((current) => ({ ...current, [page]: index }));
                    }}
                    onComplete={() => setCompletedActivities((current) => ({ ...current, [page]: true }))}
                  />
                </FeedEntrance>
              ))}
            </>
          )}
        </ScreenContent>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <ChunkyButton
          shape="card"
          label={lesson == null ? 'Done' : isLastItem ? (alreadyRead ? 'Done' : 'Got it') : 'Continue'}
          disabled={waiting}
          haptic={lesson == null || isLastItem ? 'medium' : 'tap'}
          onPress={() => {
            if (lesson == null) {
              navigation.goBack();
              return;
            }
            if (isLastItem) {
              finish();
              return;
            }
            setRevealed((count) => Math.min(itemCount, count + 1));
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    paddingVertical: spacing.md,
  },
  progress: {
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  feedBody: {
    gap: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
  },
  titleItem: {
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
    letterSpacing: -0.8,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  titleCompact: {
    fontSize: TITLE_SIZE_COMPACT,
    lineHeight: TITLE_LINE_HEIGHT_COMPACT,
  },
  followUp: {
    backgroundColor: colors.playful.teal.soft,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
  },
  followUpLabel: {
    ...typography.overline,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
  followUpQuestion: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
  followUpAction: {
    ...typography.body.small,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
  followUpOptions: { flexDirection: 'row', gap: spacing.xs },
  followUpOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    padding: spacing.xs,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followUpOptionSelected: { backgroundColor: colors.playful.teal.tintDeep },
  followUpOptionText: {
    ...typography.body.small,
    color: colors.playful.teal.ink,
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
  followUpFeedback: {
    ...typography.body.small,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
});
