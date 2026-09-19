import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MoodCheckInScreenProps } from '../app/navigation';
import { Text } from '../components/common/Text';
import ChunkyButton, {
  CHUNKY_TONE_QUIET,
} from '../components/common/ChunkyButton';
import CloseButton from '../components/common/CloseButton';
import SlideDeck from '../components/common/SlideDeck';
import ProgressBar from '../components/common/ProgressBar';
import ScreenContent from '../components/common/ScreenContent';
import Icon from '../components/common/icons/Icon';
import MoodScaleRow, {
  MOOD_SELECT_SETTLE_MS,
} from '../features/mood/MoodScaleRow';
import MoodTagGrid from '../features/mood/MoodTagGrid';
import { sanitizeMoodTags } from '../features/mood/domain/moodTags';
import {
  MOOD_SCALES,
  isCompleteMoodAnswers,
  moodBand,
  moodFaceForBand,
  moodReply,
  moodScore,
  moodRecommendationLine,
  moodSuggestion,
  type MoodAnswers,
  type MoodSuggestion,
  type MoodScaleId,
} from '../features/mood/domain/moodCheckIn';
import TECHNIQUES, {
  getTechnique,
} from '../features/exercise/guidedBreathing/techniques';
import { useOpenBreathingTechnique } from '../features/exercise/shared/hooks/useOpenBreathingTechnique';
import type { FeatureAccessState } from '../hooks/useFeatureAccess';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useSlideDeck } from '../hooks/useSlideDeck';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useMoodCheckInQuery } from '../queries/mood/useMoodCheckInQuery';
import { useSaveMoodCheckInMutation } from '../queries/mood/useSaveMoodCheckInMutation';
import {
  trackMoodCheckInCompleted,
  trackMoodCheckInOpened,
  trackMoodSuggestionAccepted,
  trackMoodSuggestionDeclined,
  trackMoodSuggestionOffered,
} from '../services/analytics/tracking';
import { useAuthStore } from '../stores/authStore';
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
/** The offer's sentence. See `recommendation` below. */
const RECOMMENDATION_SIZE = 22;
const RECOMMENDATION_LINE_HEIGHT = 30;
const RECOMMENDATION_SIZE_COMPACT = 20;
const RECOMMENDATION_LINE_HEIGHT_COMPACT = 27;
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
  // The same gate the library and Home run on, so a suggestion can never open
  // something the rest of the app would have asked them to pay for.
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const existing = useMoodCheckInQuery(userId, todayLocalDate);
  const save = useSaveMoodCheckInMutation(userId);

  const [answers, setAnswers] = useState<MoodAnswers>({});
  const [tags, setTags] = useState<string[]>([]);
  /**
   * One page per question, then the tags, then the reply.
   *
   * The tags come after the ratings on purpose. Asked first they would frame
   * the answer — somebody who has just tapped "work" rates the day as a work
   * day — and the ratings are the part that has to be uncoloured.
   */
  const TAGS_PAGE = MOOD_SCALES.length;
  const deck = useSlideDeck(MOOD_SCALES.length + 2);
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRevision = existing.data?.checkIn != null;

  useEffect(() => {
    trackMoodCheckInOpened({ source: 'plan' });
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
   * offer are all computed from the answers already in hand, so there is
   * nothing to wait for — the save runs behind the page that is already there,
   * and only a failure has anything to say.
   */
  const complete = useCallback(
    (finished: MoodAnswers, chosenTags: string[]) => {
      if (!isCompleteMoodAnswers(finished)) return;

      const band = moodBand(moodScore(finished));
      const suggestion = moodSuggestion(finished);
      const cleanTags = sanitizeMoodTags(chosenTags);

      deck.goTo(TAGS_PAGE + 1);

      trackMoodCheckInCompleted({
        band,
        questionCount: MOOD_SCALES.length,
        isRevision,
        tagCount: cleanTags.length,
      });
      if (suggestion != null) {
        trackMoodSuggestionOffered({
          answering: suggestion.answering,
          techniqueId: suggestion.techniqueId,
        });
      }

      save.mutate({
        localDate: todayLocalDate,
        answers: finished,
        tags: cleanTags,
      });
    },
    [TAGS_PAGE, deck, isRevision, save, todayLocalDate],
  );

  /**
   * One answer, whatever kind of question gave it.
   *
   * Both page types settle the same way and move on the same way, so the timing
   * lives here rather than in either of them — a grid that advanced on a
   * different beat from the rows either side of it would read as a different
   * screen.
   */
  const answer = useCallback(
    (next: MoodAnswers) => {
      setAnswers(next);

      if (advance.current != null) clearTimeout(advance.current);
      advance.current = setTimeout(() => {
        advance.current = null;
        deck.next();
      }, ADVANCE_DELAY_MS);
    },
    [deck],
  );

  const answerScale = useCallback(
    (id: MoodScaleId, rating: number) => {
      const page = MOOD_SCALES.findIndex((scale) => scale.id === id);
      if (!deck.isLive(page)) return;
      answer({ ...answers, [id]: rating });
    },
    [answer, answers, deck],
  );

  const suggestion = useMemo(
    () => (isCompleteMoodAnswers(answers) ? moodSuggestion(answers) : null),
    [answers],
  );
  const band = useMemo(
    () => (isCompleteMoodAnswers(answers) ? moodBand(moodScore(answers)) : null),
    [answers],
  );

  // The tags page counts as one, so the bar does not sit full while a page is
  // still on screen asking for something.
  const answeredCount =
    MOOD_SCALES.filter((scale) => answers[scale.id] != null).length +
    (deck.index > TAGS_PAGE ? 1 : 0);
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <CloseButton onPress={() => navigation.goBack()} />
        <View style={styles.progress}>
          {/* Driven by answers given, not by the page on screen, so it moves
              the instant a face is tapped rather than a beat later when the
              page turns. That is the other half of making a tap read as
              committed: something else on screen acknowledges it immediately,
              and the acknowledgement survives the page it was given on. */}
          <ProgressBar progress={answeredCount / (MOOD_SCALES.length + 1)} />
        </View>
        {/* Balances the close button so the bar sits centred. */}
        <View style={styles.headerSpacer} />
      </View>

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
                <MoodScaleRow
                  question={scale}
                  value={answers[scale.id] ?? null}
                  onChange={(rating) => answerScale(scale.id, rating)}
                />
              </ScreenContent>
            </View>
          </ScrollView>
        ))}

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
              label={tags.length === 0 ? 'Skip' : 'Done'}
              shape="card"
              tone={tags.length === 0 ? CHUNKY_TONE_QUIET : undefined}
              onPress={() => {
                if (!deck.isLive(TAGS_PAGE)) return;
                complete(answers, tags);
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
            <View style={styles.ask}>
              {/* The face the sentence is speaking. Both come off the band, so
                  a good day cannot be told "Good to hear" under a flat one. */}
              <Icon
                name={moodFaceForBand(band ?? 'middling')}
                size={compact ? REPLY_FACE_SIZE_COMPACT : REPLY_FACE_SIZE}
                color={colors.text.secondary}
              />
              {suggestion != null ? (
                <Text
                  style={[
                    styles.recommendation,
                    compact && styles.recommendationCompact,
                  ]}
                >
                  {moodRecommendationLine(suggestion.remedy)}
                </Text>
              ) : (
                <Text style={[styles.question, questionStyle]}>
                  {band == null ? 'Logged.' : moodReply(band)}
                </Text>
              )}
            </View>

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
                      if (save.variables != null) save.mutate(save.variables);
                    }}
                  />
                </>
              ) : null}

              {/* Two full-width buttons, both with the lip. The offer is a yes
                  or a no, so both answers are a button: a decline hidden as an
                  X in the corner makes saying no feel like escaping. */}
              {suggestion != null ? (
                <MoodSuggestionActions
                  suggestion={suggestion}
                  exerciseAccess={exerciseAccess}
                  onDecline={() => navigation.goBack()}
                />
              ) : (
                <ChunkyButton
                  label="Done"
                  shape="card"
                  onPress={() => navigation.goBack()}
                />
              )}
            </View>
          </ScreenContent>
        </ScrollView>
      </SlideDeck>
    </View>
  );
}

/**
 * The two answers to an offer, both as buttons.
 *
 * Its own component so the gate can be a hook: `useOpenBreathingTechnique` is
 * what every other entry point in the app runs a technique through, and calling
 * it here means a suggestion can never open something the library would have
 * asked the user to pay for. Mounted only when there is something to offer,
 * which is what keeps the hook out of a conditional.
 */
function MoodSuggestionActions({
  suggestion,
  exerciseAccess,
  onDecline,
}: {
  suggestion: MoodSuggestion;
  exerciseAccess: FeatureAccessState;
  onDecline: () => void;
}) {
  const technique = getTechnique(suggestion.techniqueId);
  const open = useOpenBreathingTechnique({
    technique: technique ?? FALLBACK_TECHNIQUE,
    exerciseAccess,
    sourceScreen: 'MoodCheckIn',
    sourceAction: 'mood_suggestion',
    // The session takes this screen's place rather than opening on top of it:
    // the check-in is already saved, and it is not somewhere to come back to.
    openAs: 'replace',
    onOpened: () =>
      trackMoodSuggestionAccepted({
        answering: suggestion.answering,
        techniqueId: suggestion.techniqueId,
      }),
  });

  if (technique == null) {
    return (
      <ChunkyButton label="Done" shape="card" onPress={onDecline} />
    );
  }

  return (
    <>
      <ChunkyButton label="Start" shape="card" onPress={open} />
      <ChunkyButton
        label="No thanks"
        shape="card"
        tone={CHUNKY_TONE_QUIET}
        onPress={() => {
          trackMoodSuggestionDeclined({
            answering: suggestion.answering,
            techniqueId: suggestion.techniqueId,
          });
          onDecline();
        }}
      />
    </>
  );
}

/**
 * Stands in only while the real one is missing, which can happen when a stored
 * answer names a technique a later build dropped. The button above is swapped
 * for "Done" in that case, so this is never the thing that opens.
 */
const FALLBACK_TECHNIQUE = TECHNIQUES[0];

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
    paddingTop: spacing.xl,
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
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  // Tighter than a question page: the buttons below it own the bottom.
  replyBody: {
    gap: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
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
  /**
   * Smaller than a question, because it is a sentence rather than four words.
   * At the question's 30pt this ran to nine lines on a phone and stopped being
   * a statement at all.
   */
  recommendation: {
    fontSize: RECOMMENDATION_SIZE,
    lineHeight: RECOMMENDATION_LINE_HEIGHT,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  recommendationCompact: {
    fontSize: RECOMMENDATION_SIZE_COMPACT,
    lineHeight: RECOMMENDATION_LINE_HEIGHT_COMPACT,
  },
  replyActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
