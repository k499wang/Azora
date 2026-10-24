import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import type { AzoPlanScreenProps } from '../../app/navigation';
import AppTopBar from '../../components/common/AppTopBar';
import ChunkyButton from '../../components/common/ChunkyButton';
import CloseButton from '../../components/common/CloseButton';
import { Text } from '../../components/common/Text';
import AzoTypingDots from '../../components/onboarding/AzoTypingDots';
import { triggerSoftHaptic, triggerSuccessHaptic } from '../../native/tapHaptics';
import type { AzoChatTurn } from '../../services/azoAssist/azoAssistService';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, stagger } from '../../theme/motion';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import AzoGlow from './AzoGlow';
import { PLAN_OPENER } from './domain/planOpener';
import type { SuggestedTodo } from './domain/suggestedTodo';
import FreeMessagesCaption from './FreeMessagesCaption';
import SuggestedTodoRow from './SuggestedTodoRow';
import { useAzoAssist } from './useAzoAssist';
import { useVoiceNote } from './useVoiceNote';
import VoiceNoteButton from './VoiceNoteButton';
import VoiceWaveform from './VoiceWaveform';

/** Matches the server's limit, so a long voice note isn't cut short. */
const MAX_DUMP_LENGTH = 2000;
const HERO_MIC_SIZE = 96;
const TRAY_MIC_SIZE = 56;
/** reserved whether or not the waveform is showing, so the mic never moves */
const WAVEFORM_SLOT = 40;
const HEARD_LINE_HEIGHT = typography.body.large.lineHeight;

const sameTitle = (a: SuggestedTodo, b: SuggestedTodo) =>
  a.title.trim().toLowerCase() === b.title.trim().toLowerCase();

/** Azo only sees its suggestions in its own turns, so it doesn't offer them twice. */
function azoTurn(reply: string, todos: SuggestedTodo[]): AzoChatTurn {
  if (todos.length === 0) return { role: 'azo', text: reply };
  return { role: 'azo', text: `${reply}\n[Suggested to-dos: ${todos.map((todo) => `"${todo.title}"`).join(', ')}.]` };
}

/** Talk through a brain dump and the to-dos build up on screen, ready to keep or untick — no chat, no typing. */
export default function AzoPlanScreen({ navigation }: AzoPlanScreenProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const assist = useAzoAssist('voice_plan');
  const scroll = useRef<ScrollView>(null);
  const [turns, setTurns] = useState<AzoChatTurn[]>([{ role: 'azo', text: PLAN_OPENER }]);
  const [todos, setTodos] = useState<SuggestedTodo[]>([]);
  const [kept, setKept] = useState<Set<number>>(new Set());
  /** where this round's new to-dos start, so only they stagger in */
  const [freshFrom, setFreshFrom] = useState(0);
  /** Azo's question back when what it heard was too vague to make a to-do from */
  const [prompt, setPrompt] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = async (text: string) => {
    const dump = text.trim().slice(0, MAX_DUMP_LENGTH);
    // Recognition events can race blur cleanup after navigation has already changed.
    if (!navigation.isFocused() || dump.length === 0 || thinking) return;
    const conversation: AzoChatTurn[] = [...turns, { role: 'user', text: dump }];
    setError(null);
    setThinking(true);
    try {
      const answer = await assist.ask(conversation);
      if (answer == null) return;
      setTurns([...conversation, azoTurn(answer.reply, answer.todos)]);
      const fresh = answer.todos.filter((todo) => !todos.some((shown) => sameTitle(shown, todo)));
      if (fresh.length === 0) {
        setPrompt(answer.reply);
        return;
      }
      triggerSoftHaptic();
      setPrompt(null);
      setFreshFrom(todos.length);
      setKept((current) => new Set([...current, ...fresh.map((_, index) => todos.length + index)]));
      setTodos([...todos, ...fresh]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Azo couldn’t answer right now. Try again.');
    } finally {
      setThinking(false);
    }
  };

  // The recorder holds on to its callback, so it is handed one that always plans with the latest list.
  const latestPlan = useRef(plan);
  latestPlan.current = plan;
  const planSpoken = useCallback((text: string) => { void latestPlan.current(text); }, []);
  const voice = useVoiceNote({ onText: planSpoken });
  const cancelVoice = voice.cancel;

  useFocusEffect(useCallback(() => () => cancelVoice(), [cancelVoice]));

  const toggle = (index: number) => setKept((current) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });

  const addKept = () => {
    assist.addTodos(todos.filter((_, index) => kept.has(index)), () => {
      triggerSuccessHaptic();
      navigation.goBack();
    });
  };

  const listening = voice.phase === 'recording';
  const busy = thinking || voice.phase === 'transcribing';
  // Gated before recording, so nobody talks for a minute only to meet the paywall.
  const talk = assist.blocked || assist.freeMessagesLeft === 0 ? () => assist.openPaywall() : voice.toggle;
  const hasTodos = todos.length > 0;
  const seconds = Math.floor(voice.durationMillis / 1000);
  const elapsed = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const speaking = listening || busy;
  const heardLine = speaking && voice.transcript.length > 0 ? voice.transcript : null;
  const waveformSlot = (
    <View style={styles.waveformSlot}>
      {listening ? (
        <>
          <VoiceWaveform metering={voice.metering} tick={voice.durationMillis} />
          <Text style={styles.elapsed}>{elapsed}</Text>
        </>
      ) : null}
    </View>
  );
  const errors = [error, voice.error, assist.addError == null ? null : 'Couldn’t add those. Try again.']
    .filter((message): message is string => message != null);
  const errorLines = errors.map((message) => (
    <Text key={message} accessibilityRole="alert" style={styles.error}>{message}</Text>
  ));
  const mic = (size: number) => (
    <AzoGlow active={listening || busy} radius={size / 2}>
      <View style={[card.base, card.shadow, styles.mic, { width: size, height: size, borderRadius: size / 2 }]}>
        <VoiceNoteButton
          size={size}
          phase={thinking ? 'transcribing' : voice.phase}
          metering={voice.metering}
          onPress={talk}
        />
      </View>
    </AzoGlow>
  );

  return (
    <View style={styles.screen}>
      <AppTopBar
        title="Brain dump"
        rightSlot={<CloseButton accessibilityLabel="Close" onPress={() => navigation.goBack()} />}
        showAvatar={false}
        showStreak={false}
      />
      {hasTodos ? (
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          {todos.map((todo, index) => (
            <Animated.View
              key={todo.title}
              entering={reducedMotion || index < freshFrom
                ? undefined
                : FadeInDown.delay(stagger.base * (index - freshFrom))
                  .duration(duration.base)
                  .easing(easing.enter)}
            >
              <SuggestedTodoRow
                todo={todo}
                selected={kept.has(index)}
                disabled={assist.adding}
                onToggle={() => toggle(index)}
              />
            </Animated.View>
          ))}
          {thinking ? (
            <View style={styles.thinking} accessible accessibilityLabel="Azo is adding more">
              <AzoTypingDots reducedMotion={reducedMotion} />
            </View>
          ) : null}
          {prompt != null ? <Text style={styles.prompt}>{prompt}</Text> : null}
          {errorLines}
        </ScrollView>
      ) : (
        <View style={styles.hero}>
          {/* The mic is the one thing centred; the words above and below hang
              off it, so nothing appearing or fading ever moves it. */}
          <View style={styles.heroMic}>
            <View style={styles.above}>
              {speaking ? (
                <HeardText text={heardLine ?? ''} lines={4} />
              ) : (
                <Text style={styles.heading}>{prompt ?? 'Brain dump it all. I’ll sort and structure it.'}</Text>
              )}
              {waveformSlot}
            </View>
            {mic(HERO_MIC_SIZE)}
            <View style={styles.below}>{errorLines}</View>
          </View>
        </View>
      )}

      <View style={[styles.tray, { paddingBottom: insets.bottom + spacing.sm }]}>
        {assist.freeMessagesLeft != null ? (
          <FreeMessagesCaption left={assist.freeMessagesLeft} onUpgrade={() => assist.openPaywall('upsell')} />
        ) : null}
        {hasTodos ? (
          <>
            {heardLine != null ? <HeardText text={heardLine} lines={2} /> : null}
            {waveformSlot}
            <View style={styles.actions}>
              <View style={styles.flex}>
                <ChunkyButton
                  label={`Add ${kept.size}`}
                  disabled={kept.size === 0 || busy}
                  loading={assist.adding}
                  onPress={addKept}
                />
              </View>
              {mic(TRAY_MIC_SIZE)}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

/**
 * The words so far in a fixed window that keeps the newest line at the bottom.
 * The text wraps from its start and older lines slide up out of view, so a
 * line never re-wraps as words are added — unlike clipping from the front.
 */
function HeardText({ text, lines }: { text: string; lines: number }) {
  return (
    <View style={[styles.heardWindow, { height: HEARD_LINE_HEIGHT * lines }]}>
      <Text style={styles.heard}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  flex: { flex: 1 },
  list: {
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
  heroMic: { alignItems: 'center' },
  above: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  below: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    gap: spacing.xs,
    paddingTop: spacing.lg,
  },
  heading: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    maxWidth: 320,
  },
  heardWindow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heard: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  waveformSlot: {
    height: WAVEFORM_SLOT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  elapsed: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  mic: { alignItems: 'center', justifyContent: 'center' },
  thinking: { alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  prompt: { ...typography.body.medium, color: colors.text.primary, textAlign: 'center', marginTop: spacing.sm },
  error: { ...typography.body.small, color: colors.error[700], textAlign: 'center' },
  tray: {
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.sm,
    backgroundColor: colors.background.canvas,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
