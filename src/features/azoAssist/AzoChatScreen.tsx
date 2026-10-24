import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  LinearTransition,
  useReducedMotion,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import type { AzoChatScreenProps } from '../../app/navigation';
import AppTopBar from '../../components/common/AppTopBar';
import CloseButton from '../../components/common/CloseButton';
import GlassSurface from '../../components/common/GlassSurface';
import { RiseUnlessReducedMotion } from '../../components/common/Reveal';
import ScreenContent from '../../components/common/ScreenContent';
import { Text, TextInput } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import AzoTypingDots from '../../components/onboarding/AzoTypingDots';
import {
  triggerMessageHaptic,
  triggerSoftHaptic,
  triggerSuccessHaptic,
  triggerTapHaptic,
} from '../../native/tapHaptics';
import { trackAzoAssistRequested } from '../../services/analytics/tracking';
import {
  AzoAssistAccessError,
  askAzo,
  type AzoChatTurn,
} from '../../services/azoAssist/azoAssistService';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, stagger } from '../../theme/motion';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import AzoPortrait from '../mascot/AzoPortrait';
import AzoGlow from './AzoGlow';
import type { SuggestedTodo } from './domain/suggestedTodo';
import FreeMessagesCaption from './FreeMessagesCaption';
import SuggestedTodoRow from './SuggestedTodoRow';
import { useAzoAssist } from './useAzoAssist';
import { STREAM_TAIL_LENGTH, useStreamedText } from './useStreamedText';
import { useVoiceNote } from './useVoiceNote';
import VoiceNoteButton from './VoiceNoteButton';

const MAX_MESSAGE_LENGTH = 1000;
const PILL_HEIGHT = 44;
const COMPOSER_HEIGHT = 60;
const COMPOSER_ICON_SIZE = 40;

/** The send button eases in and the mic glides aside; built fresh per use, since builders mutate. */
const easeIn = () => ZoomIn.duration(duration.fast).easing(easing.enter);
const glide = () => LinearTransition.duration(duration.fast).easing(easing.enter);

/** Ebb-style jump-starts, so nobody has to face an empty box. */
const STARTERS = [
  'Help me plan my day',
  'I keep putting something off',
  'I don’t know where to start',
  'I can’t switch off tonight',
];

/** From the Routine sparkle, Azo opens by asking, so their first reply is a plan request. */
const PLAN_OPENER = 'What’s on your mind today? Let it all out—messy is fine. I’ll turn it into manageable to-dos you can add to your list.';

interface Message extends AzoChatTurn {
  id: number;
  todos?: SuggestedTodo[];
  /** which suggested to-dos are still ticked */
  kept?: Set<number>;
  added?: boolean;
  dismissed?: boolean;
  /** still being revealed; its suggestions wait until it has finished */
  streaming?: boolean;
}

export default function AzoChatScreen({ navigation, route }: AzoChatScreenProps) {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const planning = route.params?.opener === 'plan';
  const assist = useAzoAssist(planning ? 'sparkle' : 'chat');
  const scroll = useRef<ScrollView>(null);
  const nextId = useRef(planning ? 1 : 0);
  const [messages, setMessages] = useState<Message[]>(
    planning ? [{ id: 0, role: 'azo', text: PLAN_OPENER }] : [],
  );
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendSpoken = useCallback((text: string) => {
    setDraft((current) => `${current.trim()} ${text}`.trim().slice(0, MAX_MESSAGE_LENGTH));
  }, []);
  const voice = useVoiceNote({ onText: appendSpoken });

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || thinking) return;
    // While access is still loading the server is the gate, so a Pro user is never bounced.
    if (!assist.access.isLoading && !assist.access.allowed) {
      assist.openPaywall();
      return;
    }
    const conversation: Message[] = [...messages, { id: nextId.current++, role: 'user', text: trimmed }];
    setMessages(conversation);
    setDraft('');
    setError(null);
    voice.clearError();
    setThinking(true);
    try {
      const answer = await askAzo({
        messages: conversation.map(({ role, text: turnText }) => ({ role, text: turnText })),
        todos: assist.todayTitles,
      });
      trackAzoAssistRequested({ surface: planning ? 'sparkle' : 'chat', outcome: 'answered' });
      assist.recordFreeMessagesLeft(answer.freeMessagesLeft);
      triggerMessageHaptic();
      setMessages((current) => [...current, {
        id: nextId.current++,
        role: 'azo',
        text: answer.reply,
        todos: answer.todos,
        kept: new Set(answer.todos.map((_, index) => index)),
        streaming: true,
      }]);
    } catch (nextError) {
      trackAzoAssistRequested({ surface: planning ? 'sparkle' : 'chat', outcome: 'failed' });
      setMessages((current) => current.filter((message) => message !== conversation[conversation.length - 1]));
      setDraft(trimmed);
      if (nextError instanceof AzoAssistAccessError) {
        assist.refreshFreeMessages();
        assist.openPaywall();
        return;
      }
      setError(nextError instanceof Error ? nextError.message : 'Azo couldn’t answer right now. Try again.');
    } finally {
      setThinking(false);
    }
  };

  const updateMessage = (id: number, change: (message: Message) => Message) => {
    setMessages((current) => current.map((message) => message.id === id ? change(message) : message));
  };

  const toggleTodo = (id: number, index: number) => updateMessage(id, (message) => {
    const kept = new Set(message.kept);
    if (kept.has(index)) kept.delete(index);
    else kept.add(index);
    return { ...message, kept };
  });

  /** Azo's local reply to a tap on its suggestions; it joins the conversation the model sees next. */
  const confirm = (text: string) => {
    setMessages((current) => [...current, { id: nextId.current++, role: 'azo', text, streaming: true }]);
  };

  const addKept = (message: Message) => {
    const todos = (message.todos ?? []).filter((_, index) => message.kept?.has(index));
    assist.addTodos(todos, () => {
      triggerSuccessHaptic();
      updateMessage(message.id, (current) => ({ ...current, added: true }));
      confirm(todos.length === 1
        ? 'Added it to today. One less thing to hold in your head.'
        : `Added ${todos.length} to today. One less thing to hold in your head.`);
    });
  };

  const skip = (message: Message) => {
    triggerTapHaptic();
    updateMessage(message.id, (current) => ({ ...current, dismissed: true }));
    confirm('No problem, I left those off. Tell me if you want something different.');
  };

  const hasDraft = draft.trim().length > 0;
  const outOfFree = assist.freeMessagesLeft === 0;
  const upgrade = () => assist.openPaywall('upsell');

  return (
    <View style={styles.screen}>
      <AppTopBar
        rightSlot={<CloseButton accessibilityLabel="Close" onPress={() => navigation.goBack()} />}
        showAvatar={false}
        showStreak={false}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          <ScreenContent width="grouped" style={styles.content}>
            {messages.length === 0 ? (
              <View style={styles.welcome}>
                <RiseUnlessReducedMotion reducedMotion={reducedMotion}>
                  <AzoPortrait size={140} expression="happy" active={focused} />
                </RiseUnlessReducedMotion>
                <RiseUnlessReducedMotion reducedMotion={reducedMotion} delay={stagger.base}>
                  <Text style={styles.heading}>Dump it all here. I’ll turn it into a plan.</Text>
                </RiseUnlessReducedMotion>
                <View style={styles.starters}>
                  {STARTERS.map((starter, index) => (
                    <RiseUnlessReducedMotion
                      key={starter}
                      reducedMotion={reducedMotion}
                      delay={stagger.base * 2 + stagger.tight * index}
                    >
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          triggerTapHaptic();
                          void send(starter);
                        }}
                        style={({ pressed }) => [card.base, card.shadow, styles.starter, pressed && pressable.control]}
                      >
                        <Text style={styles.starterText}>{starter}</Text>
                      </Pressable>
                    </RiseUnlessReducedMotion>
                  ))}
                </View>
              </View>
            ) : null}

            {messages.map((message) => message.role === 'user' ? (
              <View key={message.id} style={[card.base, card.shadow, styles.bubble, styles.userBubble]}>
                <Text style={styles.userText}>{message.text}</Text>
              </View>
            ) : (
              <View key={message.id} style={styles.azoTurn}>
                <View style={[card.shadow, styles.bubble, styles.azoBubble]}>
                  <AzoReply
                    text={message.text}
                    streaming={message.streaming === true}
                    onDone={() => {
                      if ((message.todos?.length ?? 0) > 0) triggerSoftHaptic();
                      updateMessage(message.id, (current) => ({ ...current, streaming: false }));
                    }}
                  />
                </View>
                {message.streaming !== true && message.todos != null && message.todos.length > 0 ? (
                  <View style={[styles.suggestions, message.dismissed === true && styles.skipped]}>
                    {message.todos.map((todo, index) => (
                      <SuggestedTodoRow
                        key={`${message.id}:${index}`}
                        todo={todo}
                        selected={message.dismissed !== true && (message.kept?.has(index) ?? false)}
                        disabled={message.added === true || message.dismissed === true || assist.adding}
                        onToggle={() => toggleTodo(message.id, index)}
                      />
                    ))}
                    {message.added === true || message.dismissed === true ? null : (
                      <View style={styles.decision}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Add to today"
                          disabled={(message.kept?.size ?? 0) === 0 || assist.adding}
                          onPress={() => {
                            triggerTapHaptic();
                            addKept(message);
                          }}
                          style={({ pressed }) => [
                            styles.pill,
                            styles.addPill,
                            (message.kept?.size ?? 0) === 0 && pressable.disabled,
                            pressed && pressable.control,
                          ]}
                        >
                          {assist.adding
                            ? <ActivityIndicator color={colors.text.inverse} />
                            : <Text style={[styles.pillText, styles.addPillText]}>Add ({message.kept?.size ?? 0})</Text>}
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          disabled={assist.adding}
                          onPress={() => skip(message)}
                          style={({ pressed }) => [card.base, card.shadow, styles.pill, pressed && pressable.control]}
                        >
                          <Text style={styles.pillText}>Not now</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            ))}

            {thinking ? (
              <View
                style={[card.shadow, styles.bubble, styles.azoBubble, styles.typing]}
                accessible
                accessibilityLabel="Azo is typing"
              >
                <AzoTypingDots reducedMotion={reducedMotion} />
              </View>
            ) : null}
            {error != null ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {voice.error != null ? <Text accessibilityRole="alert" style={styles.error}>{voice.error}</Text> : null}
          </ScreenContent>
        </ScrollView>

        <View style={[styles.composerTray, { paddingBottom: insets.bottom + spacing.sm }]}>
          <ScreenContent width="grouped" style={styles.trayContent}>
            {assist.freeMessagesLeft != null ? (
              <FreeMessagesCaption left={assist.freeMessagesLeft} onUpgrade={upgrade} />
            ) : null}
            <AzoGlow active={thinking || voice.phase !== 'idle'} radius={COMPOSER_HEIGHT / 2}>
              <GlassSurface radius={COMPOSER_HEIGHT / 2} style={styles.composer}>
                <TextInput
                  multiline
                  value={draft}
                  onChangeText={setDraft}
                  maxLength={MAX_MESSAGE_LENGTH}
                  editable={voice.phase === 'idle'}
                  placeholder={voice.phase === 'recording'
                    ? `Listening… ${Math.floor(voice.durationMillis / 1000)}s`
                    : voice.phase === 'transcribing' ? 'Writing it down…' : 'What’s today’s plan?'}
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.input}
                  accessibilityLabel="Message Azo"
                />
                <Animated.View layout={reducedMotion ? undefined : glide()}>
                  <VoiceNoteButton
                    size={COMPOSER_ICON_SIZE}
                    phase={voice.phase}
                    metering={voice.metering}
                    onPress={outOfFree ? () => assist.openPaywall() : voice.toggle}
                  />
                </Animated.View>
                {hasDraft && voice.phase === 'idle' ? (
                  <Animated.View
                    entering={reducedMotion ? undefined : easeIn()}
                    exiting={reducedMotion ? undefined : ZoomOut.duration(duration.fast)}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send"
                      disabled={thinking}
                      hitSlop={4}
                      onPress={() => {
                        triggerTapHaptic();
                        void send(draft);
                      }}
                      style={({ pressed }) => [styles.send, thinking && pressable.disabled, pressed && pressable.control]}
                    >
                      <Icon name="arrow-up" size={22} color={colors.text.inverse} />
                    </Pressable>
                  </Animated.View>
                ) : null}
              </GlassSurface>
            </AzoGlow>
          </ScreenContent>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function AzoReply({ text, streaming, onDone }: { text: string; streaming: boolean; onDone: () => void }) {
  const { settled, tail } = useStreamedText(text, streaming, onDone);
  return (
    <Text style={styles.azoText} accessibilityLabel={text}>
      {settled}
      {tail.map(({ word, step }, index) => (
        <Text key={index} style={{ color: colors.streamingTail[STREAM_TAIL_LENGTH - 1 - step] }}>{word}</Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  heading: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    maxWidth: 300,
  },
  starters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  starter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  starterText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: radius.xs,
  },
  userText: { ...typography.body.large, color: colors.text.primary },
  azoTurn: { gap: spacing.sm },
  azoBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: radius.xs,
    backgroundColor: colors.primary.blue100,
  },
  azoText: { ...typography.body.large, color: colors.text.primary },
  typing: { paddingVertical: spacing.md },
  suggestions: { gap: spacing.sm },
  skipped: pressable.disabled,
  decision: { alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  pill: {
    minWidth: 120,
    minHeight: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  addPill: { backgroundColor: colors.primary.blue500 },
  pillText: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  addPillText: { color: colors.text.inverse },
  error: { ...typography.body.small, color: colors.error[700], textAlign: 'center' },
  composerTray: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.sm,
    backgroundColor: colors.background.canvas,
  },
  trayContent: { gap: spacing.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    minHeight: COMPOSER_HEIGHT,
    paddingLeft: spacing.lg,
    paddingRight: (COMPOSER_HEIGHT - COMPOSER_ICON_SIZE) / 2,
    paddingVertical: (COMPOSER_HEIGHT - COMPOSER_ICON_SIZE) / 2,
  },
  send: {
    width: COMPOSER_ICON_SIZE,
    height: COMPOSER_ICON_SIZE,
    borderRadius: COMPOSER_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue500,
  },
  input: {
    flex: 1,
    alignSelf: 'center',
    ...typography.body.large,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    maxHeight: 120,
    padding: 0,
  },
});
