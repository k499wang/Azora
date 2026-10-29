import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import Animated, {
  LinearTransition,
  useReducedMotion,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import type { AzoChatScreenProps } from '../../app/navigation';
import GlassSurface from '../../components/common/GlassSurface';
import { RiseUnlessReducedMotion } from '../../components/common/Reveal';
import ScreenContent from '../../components/common/ScreenContent';
import { Text, TextInput } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { AzoChatHeader, azoChatColors } from '../../components/onboarding/AzoChatChrome';
import AzoTypingDots from '../../components/onboarding/AzoTypingDots';
import {
  triggerMessageHaptic,
  triggerSoftHaptic,
  triggerSuccessHaptic,
  triggerTapHaptic,
} from '../../native/tapHaptics';
import type { AzoChatTurn } from '../../services/azoAssist/azoAssistService';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, stagger } from '../../theme/motion';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import GoalEditSheet from '../selfCare/GoalEditSheet';
import AzoPortrait from '../mascot/AzoPortrait';
import AzoGlow from './AzoGlow';
import type { SuggestedTodo } from './domain/suggestedTodo';
import { removesRepeat, todoChangeNote, type TodoChange } from './domain/todoChange';
import FreeMessagesCaption from './FreeMessagesCaption';
import SuggestedTodoRow from './SuggestedTodoRow';
import TodoChangeRow from './TodoChangeRow';
import { useAzoAssist } from './useAzoAssist';
import { useAzoAssistCopy } from './useAzoAssistCopy';
import { STREAM_TAIL_LENGTH, useStreamedText } from './useStreamedText';
import { useVoiceNote } from './useVoiceNote';
import VoiceNoteButton from './VoiceNoteButton';

/** Matches the server's limit, so a long voice note isn't cut short. */
const MAX_MESSAGE_LENGTH = 2000;
const PILL_HEIGHT = 44;
const COMPOSER_HEIGHT = 60;
const COMPOSER_ICON_SIZE = 40;

/** The send button eases in and the mic glides aside; built fresh per use, since builders mutate. */
const easeIn = () => ZoomIn.duration(duration.fast).easing(easing.enter);
const glide = () => LinearTransition.duration(duration.fast).easing(easing.enter);

/** Ebb-style jump-starts, so nobody has to face an empty box. */
interface Message extends AzoChatTurn {
  id: number;
  todos?: SuggestedTodo[];
  /** which suggested to-dos are still ticked */
  kept?: Set<number>;
  /** changes to to-dos they already have, shown above the new ones */
  changes?: TodoChange[];
  keptChanges?: Set<number>;
  added?: boolean;
  dismissed?: boolean;
  /** still being revealed; its suggestions wait until it has finished */
  streaming?: boolean;
}

export default function AzoChatScreen({ navigation, route }: AzoChatScreenProps) {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  // From the Routine add menu, Azo opens by asking, so their first reply is a plan request.
  const planning = route.params?.opener === 'plan';
  const assist = useAzoAssist(planning ? 'sparkle' : 'chat');
  const copy = useAzoAssistCopy();
  const todayLocalDate = useTodayLocalDate();
  const scroll = useRef<ScrollView>(null);
  const nextId = useRef(planning ? 1 : 0);
  const [messages, setMessages] = useState<Message[]>(
    planning ? [{ id: 0, role: 'azo', text: copy.planOpener }] : [],
  );
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ messageId: number; index: number } | null>(null);

  const appendSpoken = useCallback((text: string) => {
    setDraft((current) => `${current.trim()} ${text}`.trim().slice(0, MAX_MESSAGE_LENGTH));
  }, []);
  const voice = useVoiceNote({ onText: appendSpoken });

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || thinking) return;
    if (assist.blocked) {
      assist.openPaywall();
      return;
    }
    const conversation: Message[] = [...messages, { id: nextId.current++, role: 'user', text: trimmed }];
    setMessages(conversation);
    setDraft('');
    setError(null);
    voice.clearError();
    setThinking(true);
    const rollBack = () => {
      setMessages((current) => current.filter((message) => message !== conversation[conversation.length - 1]));
      setDraft(trimmed);
    };
    try {
      const answer = await assist.ask(conversation.map((message) => turnForAzo(message, todayLocalDate)));
      if (answer == null) {
        rollBack();
        return;
      }
      triggerMessageHaptic();
      setMessages((current) => [...current, {
        id: nextId.current++,
        role: 'azo',
        text: answer.reply,
        todos: answer.todos,
        kept: new Set(answer.todos.map((_, index) => index)),
        changes: answer.changes,
        keptChanges: new Set(answer.changes.map((_, index) => index)),
        streaming: true,
      }]);
    } catch (nextError) {
      rollBack();
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

  const toggleChange = (id: number, index: number) => updateMessage(id, (message) => {
    const kept = new Set(message.keptChanges);
    if (kept.has(index)) kept.delete(index);
    else kept.add(index);
    return { ...message, keptChanges: kept };
  });

  /** An edited suggestion takes its card's place and is kept, since changing it means wanting it. */
  const saveEdit = (todo: SuggestedTodo) => {
    if (editing == null) return;
    updateMessage(editing.messageId, (message) => ({
      ...message,
      todos: message.todos?.map((current, index) => index === editing.index ? { ...current, ...todo } : current),
      kept: new Set(message.kept).add(editing.index),
    }));
    setEditing(null);
  };
  const editingTodo = editing == null
    ? undefined
    : messages.find((message) => message.id === editing.messageId)?.todos?.[editing.index];

  /** Azo's local reply to a tap on its suggestions; it joins the conversation the model sees next. */
  const confirm = (text: string) => {
    setMessages((current) => [...current, { id: nextId.current++, role: 'azo', text, streaming: true }]);
  };

  const addKept = (message: Message) => {
    const { todos, changes } = keptCards(message);
    void assist.save(todos, changes, () => {
      triggerSuccessHaptic();
      updateMessage(message.id, (current) => ({ ...current, added: true }));
      confirm(changes.length > 0
        ? 'Done, your list is updated. One less thing to hold in your head.'
        : todos.some((todo) => todo.startsOn != null)
          ? 'Added to your plan. One less thing to hold in your head.'
          : todos.length === 1
          ? 'Added it to today. One less thing to hold in your head.'
          : `Added ${todos.length} to today. One less thing to hold in your head.`);
    });
  };

  const skip = (message: Message) => {
    triggerTapHaptic();
    updateMessage(message.id, (current) => ({ ...current, dismissed: true }));
    confirm((message.changes?.length ?? 0) > 0
      ? 'No problem, I left your list as it is. Tell me if you want something different.'
      : 'No problem, I left those off. Tell me if you want something different.');
  };

  const hasDraft = draft.trim().length > 0;
  const outOfFree = assist.freeMessagesLeft === 0;
  const upgrade = () => assist.openPaywall('upsell');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AzoChatHeader onBack={() => navigation.goBack()} columnStyle={styles.headerColumn} />
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
                  <Text style={styles.heading}>{copy.chatHeading}</Text>
                </RiseUnlessReducedMotion>
                <View style={styles.starters}>
                  {copy.starters.map((starter, index) => (
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
              <View key={message.id} style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.userText}>{message.text}</Text>
              </View>
            ) : (
              <View key={message.id} style={styles.azoTurn}>
                <View style={[styles.bubble, styles.azoBubble]}>
                  <AzoReply
                    text={message.text}
                    streaming={message.streaming === true}
                    onDone={() => {
                      if (hasCards(message)) triggerSoftHaptic();
                      updateMessage(message.id, (current) => ({ ...current, streaming: false }));
                    }}
                  />
                </View>
                {message.streaming !== true && hasCards(message) ? (
                  <View style={styles.suggestions}>
                    {(message.changes ?? []).map((change, index) => (
                      <TodoChangeRow
                        key={`${message.id}:change:${index}`}
                        change={change}
                        selected={message.dismissed !== true && (message.keptChanges?.has(index) ?? false)}
                        disabled={assist.saving}
                        settled={message.added === true || message.dismissed === true}
                        onToggle={() => toggleChange(message.id, index)}
                      />
                    ))}
                    {(message.todos ?? []).map((todo, index) => (
                      <SuggestedTodoRow
                        key={`${message.id}:${index}`}
                        todo={todo}
                        selected={message.dismissed !== true && (message.kept?.has(index) ?? false)}
                        disabled={assist.saving}
                        settled={message.added === true || message.dismissed === true}
                        onToggle={() => toggleTodo(message.id, index)}
                        onEdit={() => setEditing({ messageId: message.id, index })}
                      />
                    ))}
                    {message.added === true || message.dismissed === true ? null : (
                      <View style={styles.decision}>
                        <DecisionPill
                          message={message}
                          saving={assist.saving}
                          onPress={() => {
                            triggerTapHaptic();
                            addKept(message);
                          }}
                        />
                        <Pressable
                          accessibilityRole="button"
                          disabled={assist.saving}
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
                style={[styles.bubble, styles.azoBubble, styles.typing]}
                accessible
                accessibilityLabel="Azo is typing"
              >
                <AzoTypingDots reducedMotion={reducedMotion} />
              </View>
            ) : null}
            {error != null ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {assist.saveError != null ? (
              <Text accessibilityRole="alert" style={styles.error}>Couldn’t update your list. Try again.</Text>
            ) : null}
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
                    : voice.phase === 'transcribing' ? 'Writing it down…' : copy.chatPlaceholder}
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
      <GoalEditSheet
        goal={editing == null || editingTodo == null
          ? null
          : { ...editingTodo, id: `${editing.messageId}:${editing.index}`, durationMinutes: editingTodo.durationMinutes ?? null }}
        pending={false}
        error={null}
        todayLocalDate={todayLocalDate}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
      />
    </View>
  );
}

function hasCards(message: Message): boolean {
  return (message.todos?.length ?? 0) > 0 || (message.changes?.length ?? 0) > 0;
}

function keptCards(message: Message): { todos: SuggestedTodo[]; changes: TodoChange[] } {
  return {
    todos: (message.todos ?? []).filter((_, index) => message.kept?.has(index)),
    changes: (message.changes ?? []).filter((_, index) => message.keptChanges?.has(index)),
  };
}

/** Says Apply once a change is ticked, and turns red when that would take a repeat off every day. */
function DecisionPill({ message, saving, onPress }: { message: Message; saving: boolean; onPress: () => void }) {
  const { todos, changes } = keptCards(message);
  const count = todos.length + changes.length;
  const destructive = changes.some(removesRepeat);
  const label = `${changes.length > 0 ? 'Apply' : 'Add'} (${count})`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={changes.length > 0 ? 'Apply changes' : 'Add to today'}
      disabled={count === 0 || saving}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        destructive ? styles.removePill : styles.addPill,
        count === 0 && pressable.disabled,
        pressed && pressable.control,
      ]}
    >
      {saving
        ? <ActivityIndicator color={colors.text.inverse} />
        : <Text style={[styles.pillText, styles.addPillText]}>{label}</Text>}
    </Pressable>
  );
}

/** Azo's cards are only on screen, so what it suggested and what they did with it travels with its reply. */
function turnForAzo(message: Message, todayLocalDate: string): AzoChatTurn {
  if (!hasCards(message)) return { role: message.role, text: message.text };
  const quote = (todos: SuggestedTodo[]) => todos.map((todo) => `"${todo.title}"`).join(', ');
  const kept = keptCards(message);
  const notes: string[] = [];
  if ((message.todos?.length ?? 0) > 0) {
    const outcome = message.added === true
      ? `They added ${quote(kept.todos)} to today`
      : message.dismissed === true ? 'They chose not now' : 'They haven’t decided yet';
    notes.push(`[Suggested to-dos: ${quote(message.todos ?? [])}. ${outcome}.]`);
  }
  if ((message.changes?.length ?? 0) > 0) {
    const outcome = message.added === true
      ? `They applied ${kept.changes.map((change) => todoChangeNote(change, todayLocalDate)).join('; ') || 'none'}`
      : message.dismissed === true ? 'They chose not now' : 'They haven’t decided yet';
    notes.push(`[Suggested changes: ${(message.changes ?? []).map((change) => todoChangeNote(change, todayLocalDate)).join('; ')}. ${outcome}.]`);
  }
  return { role: message.role, text: `${message.text}\n${notes.join('\n')}` };
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
  headerColumn: { paddingHorizontal: padding.screen.horizontal },
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
    paddingVertical: spacing.sm + spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: azoChatColors.border,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: radius.xs,
    backgroundColor: azoChatColors.reply,
  },
  userText: { ...typography.body.large, color: azoChatColors.replyInk },
  azoTurn: { gap: spacing.sm },
  azoBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: radius.xs,
    backgroundColor: azoChatColors.bubble,
  },
  azoText: { ...typography.body.large, color: azoChatColors.ink },
  typing: { paddingVertical: spacing.md },
  suggestions: { gap: spacing.sm },
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
  removePill: { backgroundColor: colors.error[500] },
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
    maxHeight: 168,
    padding: 0,
  },
});
