import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LessonScreenProps } from '../app/navigation';
import { useAfterScreenClosed } from '../app/navigation/useAfterScreenClosed';
import { Text } from '../components/common/Text';
import ChunkyButton from '../components/common/ChunkyButton';
import CloseButton from '../components/common/CloseButton';
import ProgressBar from '../components/common/ProgressBar';
import ScreenContent from '../components/common/ScreenContent';
import SlideDeck from '../components/common/SlideDeck';
import LessonBlockView from '../features/lessons/LessonBlockView';
import { handDayCompleteToHome } from '../features/room/homeDayCompleteHandoff';
import { useCloseInstantly } from '../app/navigation/useCloseInstantly';
import { takeForcedDayComplete } from '../features/room/devDayCompleteOverride';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { isLastUnfinishedDayUnit } from '../hooks/dayUnits/dayUnit';
import {
  LESSON_REVISION,
  lessonById,
  lessonForDay,
} from '../features/lessons/domain/lessonCatalogue';
import { lessonActivityId } from '../features/lessons/domain/lessonActivity';
import { useSlideDeck } from '../hooks/useSlideDeck';
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
import { triggerTapHaptic } from '../native/tapHaptics';
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
 * A short phone, where the title page has the least room. The title drops a
 * size rather than the body, because a claim is the one thing still legible
 * five points smaller.
 */
const COMPACT_HEIGHT = 700;

/**
 * The day's lesson, one thought a page.
 *
 * Tapped through rather than scrolled. A daily lesson that arrives as a page of
 * text is a page of text somebody has to decide to read, every day, before the
 * thing they actually came to do — and on the days they are busiest it is the
 * decision that goes. One idea on screen at a time, at a size you can read
 * standing up, gives a longer lesson a manageable rhythm.
 *
 * It also means the closing thought cannot be skipped past. It is the last
 * page, where the lesson becomes something the reader can consider or use.
 *
 * In development, Lesson Lab can select an authored lesson by id. That path
 * renders the same pages without recording activity or triggering rewards.
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
  const lesson = previewLessonId != null
    ? lessonById(previewLessonId)
    : day == null ? null : lessonForDay(day.enrollment.planId, day.programDay);
  const alreadyRead =
    !isPreview && lesson != null &&
    day?.completedActivityIds.includes(lessonActivityId(lesson.id)) === true;

  // The title is a page of its own: the claim, alone, before the argument for
  // it. A lesson with nothing to show is one page saying so.
  const deck = useSlideDeck(lesson == null ? 1 : lesson.blocks.length + 1);
  const [choiceSelections, setChoiceSelections] = useState<Record<number, number>>({});
  const [previousAction, setPreviousAction] = useState<LessonActionFollowUp | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState<'tried' | 'adapted' | 'later' | null>(null);
  const record = useRecordLessonReadMutation(userId);
  const firstWin = useFirstWinOfDay(userId);
  const readToEnd = useRef(false);
  const roomClaim = useRoomClaim(userId);
  const lessonUnit = roomClaim.dailies.units.find(
    (unit) => unit.kind === 'lesson',
  );
  const closeInstantly = useCloseInstantly(navigation);

  // Opened from the tour's last stop, this is where the tour ends — and only
  // once the lesson is off the screen: ending it earlier would release the
  // one-time offer onto the closing lesson, ahead of the streak popup and the
  // confetti it is owed. Every way out counts; only reading to the end earns
  // the confetti.
  useAfterScreenClosed(navigation, () => {
    if (isPreview) return;
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
    if (isPreview || userId == null || day == null) return;
    let active = true;
    setPreviousAction(null);
    setFollowUpResponse(null);
    actionForNextProgramDay(userId, day.enrollment.enrollmentId, day.programDay)
      .then((action) => { if (active) setPreviousAction(action); })
      .catch(() => {});
    return () => { active = false; };
  }, [isPreview, userId, day?.enrollment.enrollmentId, day?.programDay]);

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
          if (action?.kind === 'do' && userId != null && day != null) {
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
    // The last thing the day asked for celebrates on the tap, over Home: the
    // lesson gets out of the way at once rather than sliding off first.
    if (
      lessonUnit != null &&
      (isLastUnfinishedDayUnit(roomClaim.dailies.units, lessonUnit.id) ||
        takeForcedDayComplete())
    ) {
      handDayCompleteToHome(lessonUnit.id);
      closeInstantly();
      return;
    }
    navigation.goBack();
  };

  const advance = () => {
    triggerTapHaptic();
    deck.next();
  };

  const titleStyle = height < COMPACT_HEIGHT ? styles.titleCompact : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <CloseButton onPress={() => navigation.goBack()} />
        <View style={styles.progress}>
          <ProgressBar progress={(deck.index + 1) / deck.pageCount} />
        </View>
        {/* Balances the close button so the bar sits centred. */}
        <View style={styles.headerSpacer} />
      </View>

      <SlideDeck deck={deck}>
        {lesson == null ? (
          <LessonPage onPress={() => navigation.goBack()} insets={insets}>
            {/* A day past the end of a plan. The only row that opens this
                exists on a day that has a lesson, so this is a race with
                midnight rather than a state worth apologising for. */}
            <Text style={[styles.title, titleStyle]}>Nothing to read today.</Text>
          </LessonPage>
        ) : (
          [
            <LessonPage key="title" onPress={previousAction == null ? advance : undefined} insets={insets}>
              <Text style={[styles.title, titleStyle]}>{lesson.title}</Text>
              {previousAction != null ? (
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
              {previousAction != null ? <ChunkyButton label="Continue" shape="card" onPress={advance} /> : null}
            </LessonPage>,
            ...lesson.blocks.map((block, page) => (
              <LessonPage
                key={page}
                onPress={
                  page === lesson.blocks.length - 1 || block.kind === 'choice'
                    ? undefined
                    : advance
                }
                insets={insets}
              >
                <LessonBlockView
                  block={block}
                  selectedOption={choiceSelections[page]}
                  onSelectOption={(index) => {
                    triggerTapHaptic();
                    setChoiceSelections((current) => ({ ...current, [page]: index }));
                  }}
                />
                {block.kind === 'choice' && choiceSelections[page] != null && page !== lesson.blocks.length - 1 ? (
                  <ChunkyButton label="Continue" shape="card" onPress={advance} />
                ) : null}
                {page === lesson.blocks.length - 1 && (block.kind !== 'choice' || choiceSelections[page] != null) ? (
                  <ChunkyButton
                    label={alreadyRead ? 'Done' : 'Got it'}
                    shape="card"
                    onPress={finish}
                  />
                ) : null}
              </LessonPage>
            )),
          ]
        )}
      </SlideDeck>

      {/* Hidden rather than removed on the last page, where the closing thought
          owns its own button. Taking the line out would give the pages above
          it eighteen points more room and re-centre every one of them, mid
          turn — the page would appear to settle rather than simply arrive. */}
      <Text
        style={[
          styles.hint,
          { paddingBottom: insets.bottom + spacing.md },
          (lesson == null || deck.atEnd || (deck.index === 0 && previousAction != null) || lesson.blocks[deck.index - 1]?.kind === 'choice') && styles.hintHidden,
        ]}
      >
        Tap to continue
      </Text>
    </View>
  );
}

/**
 * One page of the lesson.
 *
 * The whole page is the tap target, not a button in the corner of it. A page
 * with one idea on it has nothing else to press, and reaching for a small
 * control every five seconds is what makes a tap-through feel like work.
 *
 * It scrolls if it has to. Everything is sized to fit the shortest phone, but
 * a large text setting must not be able to push a sentence off the bottom.
 */
function LessonPage({
  children,
  onPress,
  insets,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  insets: { bottom: number };
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={onPress == null}
      style={styles.page}
      accessibilityRole={onPress == null ? undefined : 'button'}
      accessibilityLabel={onPress == null ? undefined : 'Continue'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.pageContent,
          { paddingBottom: spacing.lg + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped" style={styles.pageBody}>
          {children}
        </ScreenContent>
      </ScrollView>
    </Pressable>
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
  page: {
    flex: 1,
  },
  /**
   * Centred while it fits, scrolled once it does not. `flexGrow` is what keeps
   * a short page centred rather than pinned to the top.
   */
  pageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  pageBody: {
    gap: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
  },
  title: {
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
    letterSpacing: -0.8,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
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
  hint: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  hintHidden: {
    opacity: 0,
  },
});
