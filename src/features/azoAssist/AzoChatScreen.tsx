import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';
import type { AzoChatScreenProps } from '../../app/navigation';
import AppTopBar from '../../components/common/AppTopBar';
import ChunkyButton from '../../components/common/ChunkyButton';
import CloseButton from '../../components/common/CloseButton';
import ScreenContent from '../../components/common/ScreenContent';
import { Text, TextInput } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import AzoTypingDots from '../../components/onboarding/AzoTypingDots';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { trackAzoAssistRequested } from '../../services/analytics/tracking';
import {
  AzoAssistAccessError,
  askAzo,
  type AzoChatTurn,
} from '../../services/azoAssist/azoAssistService';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import AzoPortrait from '../mascot/AzoPortrait';
import type { SuggestedTodo } from './domain/suggestedTodo';
import FreeMessagesCaption from './FreeMessagesCaption';
import RoundLipButton from './RoundLipButton';
import SuggestedTodoRow from './SuggestedTodoRow';
import { useAzoAssist } from './useAzoAssist';
import { useStreamedText } from './useStreamedText';
import { useVoiceNote } from './useVoiceNote';
import VoiceNoteButton from './VoiceNoteButton';

const MAX_MESSAGE_LENGTH = 1000;
const COMPOSER_BUTTON_SIZE = 44;

/** Ebb-style jump-starts, so nobody has to face an empty box. */
const STARTERS = [
  'I’m overwhelmed today',
  'Help me start one thing',
  'My routine feels like too much',
  'I can’t switch off tonight',
];

interface Message extends AzoChatTurn {
  id: number;
  todos?: SuggestedTodo[];
  /** which suggested to-dos are still ticked */
  kept?: Set<number>;
  added?: boolean;
  /** still being revealed; its suggestions wait until it has finished */
  streaming?: boolean;
}

export default function AzoChatScreen({ navigation }: AzoChatScreenProps) {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const assist = useAzoAssist('chat');
  const scroll = useRef<ScrollView>(null);
  const nextId = useRef(0);
  const [messages, setMessages] = useState<Message[]>([]);
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
    setThinking(true);
    try {
      const answer = await askAzo({
        messages: conversation.map(({ role, text: turnText }) => ({ role, text: turnText })),
        todos: assist.todayTitles,
      });
      trackAzoAssistRequested({ surface: 'chat', outcome: 'answered' });
      assist.recordFreeMessagesLeft(answer.freeMessagesLeft);
      setMessages((current) => [...current, {
        id: nextId.current++,
        role: 'azo',
        text: answer.reply,
        todos: answer.todos,
        kept: new Set(answer.todos.map((_, index) => index)),
        streaming: true,
      }]);
    } catch (nextError) {
      trackAzoAssistRequested({ surface: 'chat', outcome: 'failed' });
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

  const addKept = (message: Message) => {
    const todos = (message.todos ?? []).filter((_, index) => message.kept?.has(index));
    assist.addTodos(todos, () => updateMessage(message.id, (current) => ({ ...current, added: true })));
  };

  const hasDraft = draft.trim().length > 0;
  const outOfFree = assist.freeMessagesLeft === 0;
  const upgrade = () => assist.openPaywall('upsell');

  return (
    <View style={styles.screen}>
      <AppTopBar
        title="Ask Azo"
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
                <AzoPortrait size={140} expression="happy" active={focused} />
                <Text style={styles.heading}>Hi, I’m Azo</Text>
                <Text style={styles.subheading}>
                  Tell me what’s going on, big or small. I’ll help you find one small next step.
                </Text>
                <View style={styles.starters}>
                  {STARTERS.map((starter) => (
                    <Pressable
                      key={starter}
                      accessibilityRole="button"
                      onPress={() => {
                        triggerTapHaptic();
                        void send(starter);
                      }}
                      style={({ pressed }) => [styles.starter, pressed && pressable.surface]}
                    >
                      <Text style={styles.starterText}>{starter}</Text>
                    </Pressable>
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
                <View style={[card.base, card.shadow, styles.bubble, styles.azoBubble]}>
                  <Text style={styles.azoName}>Azo</Text>
                  <AzoReply
                    text={message.text}
                    streaming={message.streaming === true}
                    onDone={() => updateMessage(message.id, (current) => ({ ...current, streaming: false }))}
                  />
                </View>
                {message.streaming !== true && message.todos != null && message.todos.length > 0 ? (
                  <View style={styles.suggestions}>
                    {message.todos.map((todo, index) => (
                      <SuggestedTodoRow
                        key={`${message.id}:${index}`}
                        todo={todo}
                        selected={message.kept?.has(index) ?? false}
                        disabled={message.added === true || assist.adding}
                        onToggle={() => toggleTodo(message.id, index)}
                      />
                    ))}
                    {message.added === true ? (
                      <View style={styles.added}>
                        <Icon name="check" size={18} color={colors.success[700]} />
                        <Text style={styles.addedText}>Added to today</Text>
                      </View>
                    ) : (
                      <ChunkyButton
                        label="Add to today"
                        disabled={(message.kept?.size ?? 0) === 0}
                        loading={assist.adding}
                        onPress={() => addKept(message)}
                      />
                    )}
                  </View>
                ) : null}
              </View>
            ))}

            {thinking ? (
              <View
                style={[card.base, card.shadow, styles.bubble, styles.azoBubble, styles.typing]}
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
            <View style={styles.composer}>
              <View style={[card.base, styles.inputShell]}>
                <TextInput
                  multiline
                  value={draft}
                  onChangeText={setDraft}
                  maxLength={MAX_MESSAGE_LENGTH}
                  editable={voice.phase === 'idle'}
                  placeholder={voice.phase === 'recording'
                    ? `Listening… ${Math.floor(voice.durationMillis / 1000)}s`
                    : voice.phase === 'transcribing' ? 'Writing it down…' : 'Message Azo'}
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.input}
                  accessibilityLabel="Message Azo"
                />
              </View>
              {hasDraft && voice.phase === 'idle' ? (
                <RoundLipButton
                  size={COMPOSER_BUTTON_SIZE}
                  hue={colors.playful.sky}
                  accessibilityLabel="Send"
                  disabled={thinking}
                  onPress={() => { void send(draft); }}
                >
                  <Icon name="arrow-up" size={22} color={colors.text.inverse} />
                </RoundLipButton>
              ) : (
                <VoiceNoteButton
                  size={COMPOSER_BUTTON_SIZE}
                  phase={voice.phase}
                  metering={voice.metering}
                  onPress={outOfFree ? () => assist.openPaywall() : voice.toggle}
                />
              )}
            </View>
          </ScreenContent>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function AzoReply({ text, streaming, onDone }: { text: string; streaming: boolean; onDone: () => void }) {
  const shown = useStreamedText(text, streaming, onDone);
  return <Text style={styles.azoText} accessibilityLabel={text}>{shown}</Text>;
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
  },
  subheading: {
    ...typography.body.medium,
    color: colors.text.secondary,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
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
    backgroundColor: colors.primary.blue500,
  },
  userText: { ...typography.body.large, color: colors.text.inverse },
  azoTurn: { gap: spacing.sm },
  azoBubble: {
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderBottomLeftRadius: radius.xs,
  },
  azoName: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.playful.violet.ink,
  },
  azoText: { ...typography.body.large, color: colors.text.primary },
  typing: { paddingVertical: spacing.md },
  suggestions: { gap: spacing.sm },
  added: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addedText: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.success[700] },
  error: { ...typography.body.small, color: colors.error[700], textAlign: 'center' },
  composerTray: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
  },
  trayContent: { gap: spacing.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  inputShell: {
    flex: 1,
    minHeight: COMPOSER_BUTTON_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
  },
  input: {
    ...typography.body.large,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    maxHeight: 120,
    padding: 0,
  },
});
