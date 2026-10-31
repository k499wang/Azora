import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import { breakpoints, contentColumn } from '../../../theme/breakpoints';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType } from '../../../theme/typography';
import { AzoChatHeader, azoChatColors } from '../AzoChatChrome';
import {
  AZO_CONVERSATION,
  chooseAzoReply,
  getAzoConversation,
  type AzoConversationTurn,
} from '../data/azoConversation';
import AzoBubbleText from '../AzoBubbleText';
import AzoChatMessage from '../AzoChatMessage';
import AzoTypingDots from '../AzoTypingDots';
import { useAzoChatDelivery } from '../useAzoChatDelivery';
import { HexRoom } from '../../../features/room/RoomScene';
import { ROOM_SHELLS } from '../../../features/room/roomShells';

interface AzoChatScreenProps {
  turns?: readonly AzoConversationTurn[];
  answers: readonly string[];
  name: string;
  onNameChange: (name: string) => void;
  onAnswersChange: (answers: string[]) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const BUBBLE_BORDER = 1;
const SEND_SIZE = 32;
const COMPOSER_HEIGHT = 44;

/** The widest a bubble's words may run: the column, less the far-side gap and the bubble's own padding. */
function bubbleTextWidth(windowWidth: number) {
  const column = Math.min(windowWidth, breakpoints.contentMaxWidth) - spacing.md * 2;
  return Math.floor(column - spacing['2xl'] - spacing.md * 2 - BUBBLE_BORDER * 2);
}

function currentTurnAnchor(answerCount: number) {
  return ['name-0', 'greeting', 'moving-0', 'recognition-0', 'reassurance-0', 'plan-0', 'cbt-0', 'dailyPlan-0', 'room-0'][Math.min(answerCount, 8)];
}

export default function AzoChatScreen({
  turns = AZO_CONVERSATION,
  answers,
  name,
  onNameChange,
  onAnswersChange,
  onContinue,
  onSkip,
  onBack,
}: AzoChatScreenProps) {
  const insets = useSafeAreaInsets();
  const textWidth = bubbleTextWidth(useWindowDimensions().width);
  const scroll = useRef<ScrollView>(null);
  const continuing = useRef(false);
  const conversation = getAzoConversation(answers, turns, name);
  const asksName = turns[conversation.answers.length]?.asksName === true;
  const canSendName = name.trim().length > 0;
  const delivery = useAzoChatDelivery(conversation, onContinue);
  const { reducedMotion } = delivery;
  const ready = useRef(delivery.ready);
  ready.current = delivery.ready;
  const latestAnswers = useRef(conversation.answers);
  latestAnswers.current = conversation.answers;
  const pendingAnchor = useRef<string | undefined>(
    conversation.answers.length > 0 ? currentTurnAnchor(conversation.answers.length) : undefined,
  );
  const anchorPositions = useRef(new Map<string, number>());
  // Whether the reader is still at the end of the transcript, which is what
  // decides if an arriving message is brought into view. Only the reader's own
  // scrolling sets it: our animated follow reports offsets short of the end
  // while it travels, and reading those left the next message below the fold.
  const atEnd = useRef(true);
  const settleAtEnd = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
    atEnd.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - spacing.md;
  };

  const scrollToTurn = (answerCount: number) => {
    const anchor = currentTurnAnchor(answerCount);
    const y = anchorPositions.current.get(anchor);
    if (y !== undefined) {
      scroll.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: !reducedMotion });
      pendingAnchor.current = undefined;
    } else {
      pendingAnchor.current = anchor;
    }
  };

  const continueToPlan = () => {
    if (continuing.current) return;
    continuing.current = true;
    delivery.finish();
  };

  const chooseReply = (replyId: string) => {
    if (continuing.current || !ready.current) return;
    // Validate against the synchronous answer ref as well as the rendered turn.
    // A second tap on a disappearing option must not advance another turn.
    const nextAnswers = chooseAzoReply(latestAnswers.current, replyId, turns, name);
    if (!nextAnswers) return;
    // Skipping the name keeps nothing they had started typing.
    if (replyId === 'unnamed') onNameChange('');
    latestAnswers.current = nextAnswers;
    onAnswersChange(nextAnswers);
    if (getAzoConversation(nextAnswers, turns, name).complete) {
      continueToPlan();
    }
  };

  const skip = () => {
    if (continuing.current) return;
    continuing.current = true;
    delivery.cancel();
    onSkip();
  };

  const goBack = () => {
    delivery.cancel();
    continuing.current = false;
    if (latestAnswers.current.length === 0) {
      onBack();
      return;
    }
    const previousAnswers = latestAnswers.current.slice(0, -1);
    latestAnswers.current = previousAnswers;
    onAnswersChange(previousAnswers);
    scrollToTurn(previousAnswers.length);
  };

  useWhileVisible(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [onAnswersChange, onBack, reducedMotion]);

  // The keyboard covers the home indicator, so the composer drops its safe-area
  // padding while it is up and sits just above the keys.
  const [keyboardShown, setKeyboardShown] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardShown(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const showComposer = asksName && delivery.ready;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AzoChatHeader onBack={goBack} columnStyle={styles.column}>
        <Pressable
          onPress={skip}
          accessibilityRole="button"
          accessibilityLabel="Skip the chat"
          hitSlop={12}
          style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
        >
          <Text style={styles.skipLabel}>Skip</Text>
        </Pressable>
      </AzoChatHeader>

      {/*
        The authored transcript is capped at six turns; it cannot grow with user
        history. It follows the delivery: a message that arrives while the reader
        is at the end is brought into view, so no line lands below the fold
        unseen. A reader who has scrolled back keeps their place — their own
        reading position is the one that matters — and the arriving group waits
        below until they come back to it. Back is the one move the reader asks
        for, so it takes the view to the turn it is returning to.
      */}
      <ScrollView
        ref={scroll}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onLayout={() => {
          // The keyboard shrinks the transcript; keep the latest line in view.
          if (atEnd.current) scroll.current?.scrollToEnd({ animated: false });
        }}
        onScrollBeginDrag={() => {
          atEnd.current = false;
        }}
        onScrollEndDrag={settleAtEnd}
        onMomentumScrollEnd={settleAtEnd}
        contentContainerStyle={[
          styles.column,
          styles.transcript,
          { paddingBottom: showComposer ? spacing.md : Math.max(insets.bottom, spacing.lg) + spacing.md },
        ]}
        onContentSizeChange={() => {
          const anchor = pendingAnchor.current;
          if (anchor !== undefined) {
            const y = anchorPositions.current.get(anchor);
            if (y === undefined) return;
            scroll.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: false });
            pendingAnchor.current = undefined;
            return;
          }
          if (!atEnd.current) return;
          scroll.current?.scrollToEnd({ animated: !reducedMotion });
        }}
      >
        {delivery.messages.map((message, index) => {
          const isReply = message.kind === 'reply';
          const canContinue = conversation.complete && message.id === 'room-reply';
          return (
            <AzoChatMessage
              key={message.id}
              side={isReply ? 'reply' : 'azo'}
              animate={index >= delivery.animateFrom}
              active={delivery.active}
              reducedMotion={reducedMotion}
              onLayout={({ nativeEvent }) => {
                anchorPositions.current.set(message.id, nativeEvent.layout.y);
                if (pendingAnchor.current !== message.id) return;
                scroll.current?.scrollTo({
                  y: Math.max(0, nativeEvent.layout.y - spacing.md),
                  animated: false,
                });
                pendingAnchor.current = undefined;
              }}
              style={[styles.messageRow, isReply && styles.replyRow]}
            >
              {canContinue ? (
                <Pressable
                  onPress={continueToPlan}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to make my Life Reset Plan"
                  style={({ pressed }) => [styles.bubble, styles.replyBubble, pressed && styles.pressed]}
                >
                  <AzoBubbleText text={message.text} style={[styles.message, styles.replyText]} maxWidth={textWidth} />
                </Pressable>
              ) : (
                <View style={[styles.bubble, isReply && styles.replyBubble]}>
                  <AzoBubbleText
                    text={message.text}
                    style={[styles.message, isReply && styles.replyText]}
                    maxWidth={textWidth}
                  />
                  {message.id === 'moving-0' ? (
                    <View
                      accessible
                      accessibilityRole="image"
                      accessibilityLabel="Azo’s empty room, with bare walls and no furniture."
                      style={styles.emptyRoom}
                    >
                      <HexRoom width={textWidth} picks={{}} shell={ROOM_SHELLS.cream} />
                    </View>
                  ) : null}
                </View>
              )}
            </AzoChatMessage>
          );
        })}

        {!delivery.ready ? (
          <View style={[styles.bubble, styles.typing]} accessible accessibilityLabel="Azo is typing">
            <AzoTypingDots reducedMotion={reducedMotion} />
          </View>
        ) : null}

        {delivery.ready && conversation.replies.length > 0 ? (
          <View style={styles.choices}>
            {asksName ? null : <Text style={styles.choiceHint}>Tap to choose an answer</Text>}
            {conversation.replies.filter(({ id }) => id !== 'named').map((reply) => (
              <Pressable
                key={reply.id}
                accessibilityRole="button"
                accessibilityLabel={reply.label}
                onPress={() => chooseReply(reply.id)}
                style={({ pressed }) => [styles.bubble, styles.replyBubble, styles.choice, pressed && styles.pressed]}
              >
                <AzoBubbleText text={reply.label} style={[styles.message, styles.replyText]} maxWidth={textWidth} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {showComposer ? (
        <View style={[styles.composerTray, { paddingBottom: keyboardShown ? spacing.sm : Math.max(insets.bottom, spacing.sm) }]}>
          <View style={[styles.column, styles.composerRow]}>
            <View style={styles.composer}>
              <TextInput
                accessibilityLabel="Your first name"
                autoCapitalize="words"
                autoComplete="given-name"
                autoCorrect={false}
                autoFocus
                enablesReturnKeyAutomatically
                importantForAutofill="yes"
                maxLength={40}
                onChangeText={onNameChange}
                onSubmitEditing={() => chooseReply('named')}
                placeholder="Your first name only"
                placeholderTextColor={colors.text.tertiary}
                returnKeyType="send"
                selectionColor={azoChatColors.accent}
                spellCheck={false}
                style={styles.composerInput}
                textContentType="givenName"
                value={name}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send your first name"
                accessibilityState={{ disabled: !canSendName }}
                disabled={!canSendName}
                hitSlop={6}
                onPress={() => chooseReply('named')}
                style={({ pressed }) => [styles.send, !canSendName && styles.sendDisabled, pressed && styles.pressed]}
              >
                <Icon name="arrow-up" size={18} color={colors.text.inverse} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azoChatColors.background },
  column: { ...contentColumn, paddingHorizontal: spacing.md },
  skip: { paddingVertical: spacing.xs },
  skipLabel: { fontFamily: fonts.semibold, fontSize: scaleType(14), lineHeight: scaleType(18), color: azoChatColors.muted },
  scroll: { flex: 1 },
  transcript: { paddingTop: spacing.lg, gap: spacing.sm + spacing.xs },
  // Bubbles keep clear of the far side by row padding rather than a max width.
  messageRow: { alignItems: 'flex-start', paddingRight: spacing['2xl'] },
  replyRow: { alignItems: 'flex-end', paddingRight: 0, paddingLeft: spacing['2xl'] },
  bubble: {
    backgroundColor: azoChatColors.bubble,
    borderRadius: 22,
    borderWidth: BUBBLE_BORDER,
    borderColor: azoChatColors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  message: { fontSize: scaleType(23), lineHeight: scaleType(29), color: azoChatColors.ink },
  emptyRoom: { marginTop: spacing.sm },
  replyBubble: { backgroundColor: azoChatColors.reply },
  replyText: { color: azoChatColors.replyInk },
  choices: { marginTop: spacing.lg, alignItems: 'flex-end', paddingLeft: spacing['2xl'], gap: spacing.sm + spacing.xs },
  choiceHint: { fontSize: scaleType(16), lineHeight: scaleType(21), color: azoChatColors.muted },
  choice: { alignSelf: 'flex-end', minHeight: 48 },
  composerTray: {
    paddingTop: spacing.sm,
    backgroundColor: azoChatColors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: azoChatColors.border,
  },
  composerRow: { width: '100%' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: COMPOSER_HEIGHT,
    borderRadius: COMPOSER_HEIGHT / 2,
    borderWidth: BUBBLE_BORDER,
    borderColor: azoChatColors.border,
    backgroundColor: azoChatColors.card,
    paddingLeft: spacing.md,
    paddingRight: (COMPOSER_HEIGHT - SEND_SIZE) / 2 - BUBBLE_BORDER,
  },
  composerInput: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: scaleType(17),
    color: azoChatColors.ink,
    height: '100%',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  send: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: SEND_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: azoChatColors.accent,
  },
  sendDisabled: { backgroundColor: colors.neutral[300] },
  typing: { alignSelf: 'flex-start', paddingVertical: spacing.md },
  pressed: { opacity: 0.65 },
});
