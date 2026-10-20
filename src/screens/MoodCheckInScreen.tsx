import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MoodCheckInScreenProps } from '../app/navigation';
import { useAfterScreenClosed } from '../app/navigation/useAfterScreenClosed';
import { Text } from '../components/common/Text';
import ChunkyButton, {
  CHUNKY_TONE_QUIET,
} from '../components/common/ChunkyButton';
import CloseButton from '../components/common/CloseButton';
import SlideDeck from '../components/common/SlideDeck';
import ProgressBar, { STEP_PROGRESS } from '../components/common/ProgressBar';
import ScreenContent from '../components/common/ScreenContent';
import RewardAnimationPreload from '../features/plan/RewardAnimationPreload';
import Icon from '../components/common/icons/Icon';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { moodTint } from '../features/mood/CuteMoodFace';
import MoodFaceSlider, {
  MOOD_SELECT_SETTLE_MS,
} from '../features/mood/MoodFaceSlider';
import MoodTagGrid from '../features/mood/MoodTagGrid';
import MoodFeelingGrid from '../features/mood/MoodFeelingGrid';
import MoodJournalCard from '../features/mood/MoodJournalCard';
import MoodActionPicker from '../features/mood/MoodActionPicker';
import { moodActions } from '../features/mood/domain/moodActions';
import { MoodInsightCards } from '../features/plan/PlanAnalyticsSection';
import { UNGATED_INSIGHT_THRESHOLDS } from '../features/plan/domain/moodAnalytics';
import {
  INSIGHT_ACTIVITY_DAYS,
  moodInsights,
} from '../features/plan/domain/moodInsights';
import { moodJournalPrompts } from '../features/mood/domain/moodPrompts';
import { useProgramEnrollmentQuery } from '../queries/program/useProgramEnrollmentQuery';
import { sanitizeMoodTags } from '../features/mood/domain/moodTags';
import {
  MOOD_FEELING_SETS,
  moodFeelingSet,
  sanitizeMoodFeeling,
} from '../features/mood/domain/moodFeelings';
import { moodPatternLine } from '../features/mood/domain/moodPattern';
import {
  MOOD_SCALES,
  MOOD_SUPPORT_URL,
  isCompleteMoodAnswers,
  sanitizeMoodNote,
  moodBand,
  moodFaceForBand,
  moodReply,
  moodScore,
  moodSupportLine,
  moodSupportReason,
  withTodaysCheckIn,
  type MoodAnswers,
  type MoodScaleId,
} from '../features/mood/domain/moodCheckIn';
import { useSlideDeck } from '../hooks/useSlideDeck';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useMoodCheckInQuery } from '../queries/mood/useMoodCheckInQuery';
import { useRecentMoodCheckInsQuery } from '../queries/mood/useRecentMoodCheckInsQuery';
import { useSaveMoodCheckInMutation } from '../queries/mood/useSaveMoodCheckInMutation';
import { useCreateSelfCareGoalsMutation } from '../queries/selfCare/useCreateSelfCareGoalsMutation';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import {
  trackMoodCheckInCompleted,
  trackMoodCheckInOpened,
  trackMoodInsightsViewed,
  trackMoodSuggestionAccepted,
  trackMoodSuggestionDeclined,
  trackMoodSuggestionOffered,
  trackMoodSupportLinkShown,
  trackMoodSupportLinkTapped,
} from '../services/analytics/tracking';
import { useFirstWinOfDay } from '../features/selfCare/useFirstWinOfDay';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { handDayCompleteToHome } from '../features/room/homeDayCompleteHandoff';
import { useCloseOntoHome } from '../app/navigation/useCloseOntoHome';
import { takeForcedDayComplete } from '../features/room/devDayCompleteOverride';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { isLastUnfinishedDayUnit } from '../hooks/dayUnits/dayUnit';
import { hasPieceToEarn } from '../lib/room/roomProgress';
import { useAuthStore } from '../stores/authStore';
import { EARN_RATES } from '../lib/wallet/coins';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

/**
 * The question is the biggest thing on the screen by a wide margin.
 *
 * One question on a page is only worth the page if it is unmissable; set at
 * body size with an empty screen around it, it reads as a caption for the faces
 * rather than as the thing being asked.
 */
const QUESTION_SIZE = 30;
const QUESTION_LINE_HEIGHT = 37;
/**
 * A phone short enough that the reply page has no room to spare: an SE gives
 * about 550pt under the header, and a face, two lines and a 254pt shelf come to
 * roughly 500 of it.
 */
const COMPACT_HEIGHT = 700;
const QUESTION_SIZE_COMPACT = 26;
const QUESTION_LINE_HEIGHT_COMPACT = 32;
/**
 * Room for two lines of question, held on every page whether or not the
 * question needs them. Every question is one line today; the second is what
 * stops a larger text setting moving the answer on one page and not the others.
 */
const QUESTION_BLOCK_HEIGHT = QUESTION_LINE_HEIGHT * 2;
/** The face from their own answer, shown back on the reply page. */
const REPLY_FACE_SIZE = 64;
const REPLY_FACE_SIZE_COMPACT = 52;

/**
 * The beat between tapping a face and the page turning.
 *
 * Long enough that the answer is seen at rest. At 260ms the page started moving
 * while the face was still springing, so the selection was destroyed before it
 * had finished arriving — the tap read as a flicker rather than as a choice
 * being made. The two animations are now strictly in sequence: the face lands
 * inside `MOOD_SELECT_SETTLE_MS`, holds, and only then does the page move.
 *
 * The hold is the part that does the work. It is what turns "something
 * flashed" into "that was taken, and now we are moving on", and it is the
 * difference between the screen answering the user and the screen hurrying
 * them.
 */
const ADVANCE_DELAY_MS = MOOD_SELECT_SETTLE_MS + 320;
/**
 * The run the reply's pattern and support link read. The same limit Profile
 * asks for, so the run is usually already cached by the time the reply shows.
 */
const RECENT_CHECK_IN_LIMIT = 62;
/** Two weeks, today included, so a first check-in is one dot. */
const INSIGHT_TREND_DAYS = 14;


/**
 * The daily check-in: one question a page, moving sideways.
 *
 * One question at a time rather than a form. A form of four scales is answered
 * by eye — the second rating is chosen next to the first, and the fourth is
 * chosen to look consistent with the three above it. A page that holds one
 * question is answered on its own, which is the only way the four scales end up
 * measuring four things.
 *
 * Sideways rather than up: the direction carries the progress, so the bar at the
 * top is a confirmation rather than the only way to tell how much is left.
 *
 * A tap answers and moves on by itself. Answer-then-press-next is two gestures
 * for one decision, every day, and the daily thing is the one that has to cost
 * nothing.
 */
export default function MoodCheckInScreen({
  navigation,
}: MoodCheckInScreenProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  /**
   * A short phone, where the reply page has the least room: a face, two lines
   * and a 254pt shelf is about 500pt of content and an SE gives roughly 550.
   * The question drops a size rather than the shelf or the faces, because the
   * question is the one thing that is still legible four points smaller.
   */
  const compact = height < COMPACT_HEIGHT;
  const questionStyle = compact ? styles.questionCompact : null;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const existing = useMoodCheckInQuery(userId, todayLocalDate);
  const recent = useRecentMoodCheckInsQuery(userId, RECENT_CHECK_IN_LIMIT);
  const activity = useDailyActivityRangeQuery(userId, INSIGHT_ACTIVITY_DAYS);
  const enrollment = useProgramEnrollmentQuery(userId);
  const save = useSaveMoodCheckInMutation(userId);
  const createGoals = useCreateSelfCareGoalsMutation(userId, todayLocalDate);
  const roomClaim = useRoomClaim(userId);
  const dayUnits = roomClaim.dailies.units;
  /** this check-in was the last thing the day asked for */
  const [finishedDayUnitId, setFinishedDayUnitId] = useState<string | null>(
    null,
  );
  const closeOntoHome = useCloseOntoHome(navigation);
  /** the day's first check-in, which earns coins once it saves */
  const [earnedCoins, setEarnedCoins] = useState(false);
  const coins = earnedCoins && !save.isError ? EARN_RATES.lessonOrCheckIn : 0;
  const handedToReward = useRef(false);
  /**
   * Done and No thanks. A first check-in shows its coins, and the finished
   * day, if it was one, celebrates after them. Otherwise a check-in that
   * finished the day celebrates over Home, and gets out of the way at once
   * rather than sliding off first.
   */
  const leave = () => {
    if (coins > 0) {
      handedToReward.current = true;
      navigation.replace('ActivityReward', {
        kind: 'mood',
        coins,
        dayCompleteUnitId: finishedDayUnitId ?? undefined,
      });
      return;
    }
    if (finishedDayUnitId != null) {
      handDayCompleteToHome(finishedDayUnitId);
      closeOntoHome();
      return;
    }
    navigation.goBack();
  };

  const [answers, setAnswers] = useState<MoodAnswers>({});
  const moodTone = useSharedValue(0.5);
  const toneShown = useSharedValue(1);
  const toneStyle = useAnimatedStyle(() => ({
    backgroundColor: moodTint(moodTone.value),
    opacity: toneShown.value,
  }));
  /** The word picked; null is "Not sure", undefined is not answered yet. */
  const [feeling, setFeeling] = useState<string | null | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  /**
   * One page per question, then the feeling, the tags, the journal, the
   * reply, then the insights.
   *
   * The tags come after the ratings on purpose. Asked first they would frame
   * the answer — somebody who has just tapped "work" rates the day as a work
   * day — and the ratings are the part that has to be uncoloured. The feeling
   * comes straight after the ratings because its words are chosen by them.
   */
  const FEELING_PAGE = MOOD_SCALES.length;
  const TAGS_PAGE = FEELING_PAGE + 1;
  const JOURNAL_PAGE = TAGS_PAGE + 1;
  const REPLY_PAGE = JOURNAL_PAGE + 1;
  const INSIGHTS_PAGE = REPLY_PAGE + 1;
  const deck = useSlideDeck(INSIGHTS_PAGE + 1);
  const journalScroll = useRef<ScrollView>(null);
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRevision = existing.data?.checkIn != null;
  const firstWin = useFirstWinOfDay(userId);
  useAfterScreenClosed(navigation, () => {
    if (!handedToReward.current) useFirstWinOfDayStore.getState().revealAfterClose();
  });

  /**
   * Saves the answers, and claims the day's first win for them.
   *
   * The popup is queued ahead of the write so it is ready the moment this
   * screen closes, and withdrawn if the write fails — a streak the server did
   * not record is not one to announce. A retry goes through here too, so a
   * check-in that saves on the second attempt still earns it.
   */
  const saveAnswers = (input: Parameters<typeof save.mutateAsync>[0]) => {
    if (!isRevision) setEarnedCoins(true);
    const firstWinEarned = !isRevision && firstWin.claim();
    if (firstWinEarned) {
      useFirstWinOfDayStore.getState().show({ heldForClose: true });
    }
    save.mutateAsync(input).catch(() => {
      if (firstWinEarned) firstWin.withdraw();
    });
  };

  const onScalePage = deck.index < FEELING_PAGE;
  useEffect(() => {
    toneShown.value = withTiming(onScalePage ? 1 : 0, { duration: 300 });
  }, [onScalePage, toneShown]);

  useEffect(() => {
    trackMoodCheckInOpened({ source: 'plan' });
  }, []);

  // Once the keyboard is up, bring the end of the note into view above it.
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      journalScroll.current?.scrollToEnd({ animated: true });
    });
    return () => shown.remove();
  }, []);

  // A page left mid-flight must not fire into an unmounted screen.
  useEffect(() => () => {
    if (advance.current != null) clearTimeout(advance.current);
  }, []);

  /**
   * The last answer: turn the page, then save.
   *
   * The page used to turn in the mutation's `onSuccess`, so the final
   * transition waited on a network round trip while the three before it were
   * instant. On anything but a fast connection that read as the app hanging on
   * the one page where the user has just finished doing what was asked.
   *
   * Nothing on the reply page comes from the server. The band, the face and the
   * suggested actions are all computed from the answers already in hand, so there is
   * nothing to wait for — the save runs behind the page that is already there,
   * and only a failure has anything to say.
   */
  const complete = useCallback(
    (
      finished: MoodAnswers,
      chosenFeeling: string | null | undefined,
      chosenTags: string[],
      written: string,
    ) => {
      if (!isCompleteMoodAnswers(finished)) return;

      const cleanFeeling = sanitizeMoodFeeling(chosenFeeling);
      const band = moodBand(moodScore(finished));
      const offer = moodActions(finished, cleanFeeling, todayLocalDate);
      const cleanTags = sanitizeMoodTags(chosenTags);
      const cleanNote = sanitizeMoodNote(written);

      deck.goTo(REPLY_PAGE);

      // Decided before the save marks the check-in done, and celebrated once
      // the reply has been read, on the way out.
      const moodUnit = dayUnits.find((unit) => unit.kind === 'mood');
      if (
        moodUnit != null &&
        ((isLastUnfinishedDayUnit(dayUnits, moodUnit.id) &&
          hasPieceToEarn(roomClaim.progress)) ||
          takeForcedDayComplete())
      ) {
        setFinishedDayUnitId(moodUnit.id);
      }

      trackMoodCheckInCompleted({
        band,
        questionCount: MOOD_SCALES.length,
        isRevision,
        tagCount: cleanTags.length,
        feeling: cleanFeeling,
        feelingSet: moodFeelingSet(finished),
      });
      trackMoodSuggestionOffered({
        answering: offer.answering,
        actionIds: offer.actions.map((action) => action.id),
      });

      saveAnswers({
        localDate: todayLocalDate,
        answers: finished,
        tags: cleanTags,
        note: cleanNote,
        feeling: cleanFeeling,
      });
    },
    [REPLY_PAGE, dayUnits, deck, isRevision, saveAnswers, todayLocalDate],
  );

  /**
   * One answer, whatever kind of question gave it.
   *
   * The faces and the feeling words settle the same way and move on the same
   * way, so the timing lives here rather than in either of them — a grid that
   * advanced on a different beat from the rows either side of it would read as
   * a different screen.
   */
  const answer = useCallback(
    (record: () => void) => {
      record();

      if (advance.current != null) clearTimeout(advance.current);
      advance.current = setTimeout(() => {
        advance.current = null;
        deck.next();
      }, ADVANCE_DELAY_MS);
    },
    [deck],
  );

  const holdAdvance = useCallback(() => {
    if (advance.current == null) return;
    clearTimeout(advance.current);
    advance.current = null;
  }, []);

  const answerScale = useCallback(
    (id: MoodScaleId, rating: number) => {
      const page = MOOD_SCALES.findIndex((scale) => scale.id === id);
      if (!deck.isLive(page)) return;
      answer(() => setAnswers({ ...answers, [id]: rating }));
    },
    [answer, answers, deck],
  );

  const answerFeeling = useCallback(
    (picked: string | null) => {
      if (!deck.isLive(FEELING_PAGE)) return;
      answer(() => setFeeling(picked));
    },
    [FEELING_PAGE, answer, deck],
  );

  const feelingSet = moodFeelingSet(answers);
  const planId = enrollment.data?.planId ?? null;
  const journalPrompts = useMemo(
    () => moodJournalPrompts(planId, feelingSet, todayLocalDate),
    [feelingSet, planId, todayLocalDate],
  );
  const cleanFeeling = sanitizeMoodFeeling(feeling);
  const offer = useMemo(
    () =>
      isCompleteMoodAnswers(answers)
        ? moodActions(answers, cleanFeeling, todayLocalDate)
        : null,
    [answers, cleanFeeling, todayLocalDate],
  );
  const [pickedActionIds, setPickedActionIds] = useState<string[]>([]);
  const band = useMemo(
    () => (isCompleteMoodAnswers(answers) ? moodBand(moodScore(answers)) : null),
    [answers],
  );

  /**
   * Today as the reply reads it: the answers just given, standing in for
   * whatever the recent run holds for today — the save may not have landed,
   * or may be replacing an earlier answer.
   */
  const todayRow = useMemo(
    () =>
      isCompleteMoodAnswers(answers)
        ? {
            localDate: todayLocalDate,
            score: moodScore(answers),
            tags: sanitizeMoodTags(tags),
          }
        : null,
    [answers, tags, todayLocalDate],
  );
  const patternLine = useMemo(
    () =>
      todayRow == null ? null : moodPatternLine(recent.data ?? null, todayRow),
    [recent.data, todayRow],
  );
  const checkIns = useMemo(
    () =>
      todayRow == null
        ? (recent.data ?? [])
        : withTodaysCheckIn(recent.data ?? [], todayRow),
    [recent.data, todayRow],
  );
  const supportReason = useMemo(
    () =>
      todayRow == null
        ? null
        : moodSupportReason(cleanFeeling, checkIns, todayLocalDate),
    [checkIns, cleanFeeling, todayLocalDate, todayRow],
  );
  const insights = useMemo(
    () =>
      moodInsights({
        checkIns,
        activity: activity.data ?? null,
        todayLocalDate,
        trendDays: INSIGHT_TREND_DAYS,
        activityLimit: INSIGHT_ACTIVITY_DAYS,
        thresholds: UNGATED_INSIGHT_THRESHOLDS,
      }),
    [activity.data, checkIns, todayLocalDate],
  );
  const insightsViewed = useRef(false);
  const showInsights = () => {
    deck.goTo(INSIGHTS_PAGE);
    if (insightsViewed.current) return;
    insightsViewed.current = true;
    const cards = [
      insights.review != null ? 'week' : null,
      insights.trend.some((point) => point.value != null) ? 'trend' : null,
      insights.reset != null ? 'reset' : null,
      insights.factors != null ? 'factors' : null,
    ].filter((card): card is string => card != null);
    trackMoodInsightsViewed({ cards, checkInDays: checkIns.length });
  };
  const addPickedActions = async () => {
    if (offer == null) return;
    const picked = offer.actions.filter((action) =>
      pickedActionIds.includes(action.id),
    );
    try {
      await createGoals.mutateAsync(
        picked.map((action) => ({
          title: action.title,
          icon: action.icon,
          recurrence: 'once' as const,
          scheduledTime: null,
        })),
      );
    } catch {
      return;
    }
    trackMoodSuggestionAccepted({
      answering: offer.answering,
      actionIds: picked.map((action) => action.id),
    });
    showInsights();
  };


  // Once per check-in, and only once the reply is actually on screen: the
  // page is laid out long before it slides in.
  const supportShown = useRef(false);
  useEffect(() => {
    if (supportReason == null || deck.index !== REPLY_PAGE) return;
    if (supportShown.current) return;
    supportShown.current = true;
    trackMoodSupportLinkShown({ reason: supportReason });
  }, [REPLY_PAGE, deck.index, supportReason]);

  // The feeling, tags and journal pages count as one each, so the bar does not sit
  // full while a page is still on screen asking for something.
  const answeredCount =
    MOOD_SCALES.filter((scale) => answers[scale.id] != null).length +
    (feeling !== undefined ? 1 : 0) +
    (deck.index > TAGS_PAGE ? 1 : 0) +
    (deck.index > JOURNAL_PAGE ? 1 : 0);
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Animated.View style={[StyleSheet.absoluteFill, toneStyle]} pointerEvents="none" />
      <RewardAnimationPreload pose="proud" />
      <View style={styles.header}>
        <CloseButton onPress={() => navigation.goBack()} />
        <View style={styles.progress}>
          {/* Driven by answers given, not by the page on screen, so it moves
              the instant a face is tapped rather than a beat later when the
              page turns. That is the other half of making a tap read as
              committed: something else on screen acknowledges it immediately,
              and the acknowledgement survives the page it was given on. */}
          <ProgressBar {...STEP_PROGRESS} progress={answeredCount / (MOOD_SCALES.length + 3)} />
        </View>
        {/* Balances the close button so the bar sits centred. */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Lifts the journal page above the keyboard so the writing stays in view. */}
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <SlideDeck deck={deck}>
        {MOOD_SCALES.map((scale) => (
          /* Scrolls rather than clips. Everything is sized to fit the shortest
             phone, but a longer question or a larger text setting must not be
             able to push the faces off the bottom of the screen. */
          <ScrollView
            key={scale.id}
            style={styles.page}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Question then answer, and the pair of them centred on the page.
                So the question sits lower on a page whose answer is short and
                higher on the one whose answer is tall. That is the point: each
                page is balanced in itself rather than every question held at
                one measured height, which left the face pages top-heavy with a
                lot of nothing underneath them. */}
            <ScreenContent width="grouped" style={styles.askBlock}>
              <Text style={[styles.question, questionStyle]}>
                {scale.question}
              </Text>
            </ScreenContent>

            <View style={styles.answer}>
              <ScreenContent width="grouped" style={styles.answerInset}>
                <MoodFaceSlider
                  question={scale}
                  value={answers[scale.id] ?? null}
                  onChange={(rating) => answerScale(scale.id, rating)}
                  onGrab={holdAdvance}
                  mood={moodTone}
                />
              </ScreenContent>
            </View>
          </ScrollView>
        ))}

        {/* Answers itself like the faces do. The words are chosen by the
            ratings above, so the page has nothing to show until they exist —
            which is before it is ever on screen. */}
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <ScreenContent width="grouped" style={styles.askBlock}>
            <Text style={[styles.question, questionStyle]}>
              Which word fits best?
            </Text>
          </ScreenContent>

          <View style={styles.answer}>
            <ScreenContent width="grouped" style={styles.answerInset}>
              <MoodFeelingGrid
                words={feelingSet == null ? [] : MOOD_FEELING_SETS[feelingSet]}
                value={feeling}
                onChange={answerFeeling}
              />
            </ScreenContent>
          </View>
        </ScrollView>

        {/* The one page that does not answer itself: none, one or five taps,
            so it ends when the user says it does. Skipping is finishing. */}
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <ScreenContent width="grouped" style={styles.askBlock}>
            <Text style={[styles.question, questionStyle]}>
              What was going on?
            </Text>
          </ScreenContent>

          <View style={styles.answer}>
            <ScreenContent width="grouped" style={styles.answerInset}>
              <MoodTagGrid selected={tags} onChange={setTags} />
            </ScreenContent>
          </View>

          <ScreenContent width="grouped" style={styles.tagActions}>
            <ChunkyButton
              label={tags.length === 0 ? 'Skip' : 'Next'}
              shape="card"
              tone={tags.length === 0 ? CHUNKY_TONE_QUIET : undefined}
              onPress={() => {
                if (!deck.isLive(TAGS_PAGE)) return;
                deck.next();
              }}
            />
          </ScreenContent>
        </ScrollView>

        {/* Optional, like the tags: skipping it is finishing the check-in. */}
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
          ref={journalScroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <ScreenContent width="grouped" style={styles.askBlock}>
            <Text style={[styles.question, questionStyle]}>
              Want to write about it?
            </Text>
          </ScreenContent>

          <ScreenContent width="grouped" style={styles.answerInset}>
            <MoodJournalCard
              prompts={journalPrompts}
              feelingSet={feelingSet}
              value={note}
              onChange={setNote}
            />
          </ScreenContent>

          <ScreenContent width="grouped" style={styles.tagActions}>
            <ChunkyButton
              label={note.trim().length === 0 ? 'Skip' : 'Done'}
              shape="card"
              tone={note.trim().length === 0 ? CHUNKY_TONE_QUIET : undefined}
              onPress={() => {
                if (!deck.isLive(JOURNAL_PAGE)) return;
                complete(answers, feeling, tags, note);
              }}
            />
          </ScreenContent>
        </ScrollView>

        <ScrollView
          style={styles.page}
          contentContainerStyle={[
            styles.replyContent,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* No spinner. Everything here is computed from answers already in
              hand, so there is nothing the page is waiting for — and a spinner
              on the way in would put back the pause the save used to cause. */}
          <ScreenContent width="grouped" style={styles.replyBody}>
            <View style={[styles.ask, styles.replyMessage]}>
              {/* The face the sentence is speaking. Both come off the band, so
                  a good day cannot be told "Good to hear" under a flat one. */}
              <Icon
                name={moodFaceForBand(band ?? 'middling')}
                size={compact ? REPLY_FACE_SIZE_COMPACT : REPLY_FACE_SIZE}
                color={colors.text.secondary}
              />
              <Text style={styles.question}>
                {band == null ? 'Logged.' : moodReply(band, cleanFeeling)}
              </Text>
              {patternLine != null ? (
                <Text style={styles.pattern}>{patternLine}</Text>
              ) : null}
            </View>

            <View style={styles.replyFooter}>
              {supportReason != null ? (
                <View style={styles.support}>
                  <Text style={styles.pattern}>
                    {moodSupportLine(supportReason)}
                  </Text>
                  <ChunkyButton
                    label="Find someone to talk to"
                    shape="card"
                    tone={CHUNKY_TONE_QUIET}
                    onPress={() => {
                      trackMoodSupportLinkTapped({ reason: supportReason });
                      void Linking.openURL(MOOD_SUPPORT_URL);
                    }}
                  />
                </View>
              ) : null}

              {offer != null ? (
                <MoodActionPicker
                  actions={offer.actions}
                  selected={pickedActionIds}
                  disabled={createGoals.isPending}
                  onChange={setPickedActionIds}
                />
              ) : null}

              {/* The way out sits on the page it belongs to rather than in a bar
                  of its own.

                  A bar under the strip is a sibling with a height, and it had
                  none until the last answer was given — so it arrived as the
                  reply slid in, took height off the pages above it, and every
                  page re-centred mid-transition. The sentence the user is being
                  shown appeared to settle into place rather than simply be
                  there. Here it is part of the page, laid out once, before the
                  page is ever on screen. */}
              <View style={styles.replyActions}>
                {/* Only a failure has anything to say. There is no line for the
                    save itself: it starts as this page arrives and finishes a
                    moment later, so anything reporting it is a word that appears
                    and vanishes under a sentence the user is still reading. The
                    save needs nothing from them, and a check-in that saved is
                    not news. */}
                {save.isError ? (
                  <>
                    <Text style={styles.error}>
                      That didn’t save. Check your connection and try again.
                    </Text>
                    <ChunkyButton
                      label="Try again"
                      shape="card"
                      onPress={() => {
                        if (save.variables != null) saveAnswers(save.variables);
                      }}
                    />
                  </>
                ) : null}

                {createGoals.isError ? (
                  <Text style={styles.error}>
                    That didn’t add. Check your connection and try again.
                  </Text>
                ) : null}
                {/* Both answers are a button: a decline hidden as an X in the
                    corner makes saying no feel like escaping. */}
                {offer != null ? (
                  <>
                    <ChunkyButton
                      label="Add to my day"
                      shape="card"
                      disabled={pickedActionIds.length === 0}
                      loading={createGoals.isPending}
                      onPress={() => void addPickedActions()}
                    />
                    <ChunkyButton
                      label="No thanks"
                      shape="card"
                      tone={CHUNKY_TONE_QUIET}
                      disabled={createGoals.isPending}
                      onPress={() => {
                        trackMoodSuggestionDeclined({
                          answering: offer.answering,
                          actionIds: offer.actions.map((action) => action.id),
                        });
                        showInsights();
                      }}
                    />
                  </>
                ) : (
                  <ChunkyButton label="Done" shape="card" onPress={leave} />
                )}
              </View>
            </View>
          </ScreenContent>
        </ScrollView>

        <View style={styles.page}>
          <ScrollView
            style={styles.page}
            contentContainerStyle={styles.insightsContent}
            showsVerticalScrollIndicator={false}
          >
            <ScreenContent width="grouped" style={styles.insightsBody}>
              <Text style={[styles.question, questionStyle]}>Your insights</Text>
              <MoodInsightCards
                review={insights.review}
                trend={insights.trend}
                reset={insights.reset}
                factors={insights.factors}
              />
            </ScreenContent>
          </ScrollView>
          <ScreenContent
            width="grouped"
            style={[
              styles.insightsActions,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <ChunkyButton label="Done" shape="card" onPress={leave} />
          </ScreenContent>
        </View>
      </SlideDeck>
      </KeyboardAvoidingView>
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
  page: {
    flex: 1,
  },
  /**
   * Centred while it fits, scrolled once it does not.
   *
   * `flexGrow` is what keeps a short page centred rather than pinned to the
   * top; the scroll is only ever reached by a long question, a large text
   * setting, or a phone smaller than any we have measured.
   */
  pageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
  },
  /**
   * Where the question sits, on every page.
   *
   * A reserved height rather than a natural one, so a question that wraps to
   * two lines does not push the answer down on that page alone.
   */
  askBlock: {
    minHeight: QUESTION_BLOCK_HEIGHT,
    justifyContent: 'flex-start',
    paddingHorizontal: padding.screen.horizontal,
  },
  // As tall as whatever is in it. The page centres the question and the answer
  // together, so an answer that claimed more room than it needed would push the
  // question up the screen for nothing.
  answer: {
    justifyContent: 'center',
  },
  tagActions: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.lg,
  },
  answerInset: {
    paddingHorizontal: padding.screen.horizontal,
  },
  /**
   * The last page centres, where a question page pins its title to the top.
   *
   * It has no question and no answer, so there is nothing to hold still: it is
   * one statement with the two buttons under it, and a statement floating at
   * the top of an empty screen reads as the page having failed to load.
   */
  replyContent: {
    flexGrow: 1,
    paddingVertical: spacing.lg,
  },
  /**
   * The buttons hold the bottom on every reply; the sentence centres in what is
   * left above them, so a longer one grows upward instead of moving them.
   */
  replyBody: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
  },
  replyMessage: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  replyFooter: {
    alignSelf: 'stretch',
    gap: spacing.lg,
  },
  ask: {
    alignItems: 'center',
    gap: spacing.md,
  },
  question: {
    fontSize: QUESTION_SIZE,
    lineHeight: QUESTION_LINE_HEIGHT,
    letterSpacing: -0.6,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  questionCompact: {
    fontSize: QUESTION_SIZE_COMPACT,
    lineHeight: QUESTION_LINE_HEIGHT_COMPACT,
  },
  /** Their own history, under the sentence it qualifies and quieter than it. */
  pattern: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  support: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  replyActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  insightsContent: {
    paddingVertical: spacing.lg,
  },
  insightsBody: {
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
  },
  insightsActions: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
