import { useRef } from 'react';
import {
  BackHandler,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../common/Text';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import { breakpoints, contentColumn } from '../../../theme/breakpoints';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType } from '../../../theme/typography';
import { AzoChatAvatar, AzoChatBackButton, azoChatColors } from '../AzoChatChrome';
import { chooseAzoReply, getAzoConversation } from '../data/azoConversation';
import AzoBubbleText from '../AzoBubbleText';
import AzoChatMessage from '../AzoChatMessage';
import AzoTypingDots from '../AzoTypingDots';
import { useAzoChatDelivery } from '../useAzoChatDelivery';
import { HexRoom } from '../../../features/room/RoomScene';
import { ROOM_SHELLS } from '../../../features/room/roomShells';

interface AzoChatScreenProps {
  answers: readonly string[];
  onAnswersChange: (answers: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

const BUBBLE_BORDER = 1;

/** The widest a bubble's words may run: the column, less the far-side gap and the bubble's own padding. */
function bubbleTextWidth(windowWidth: number) {
  const column = Math.min(windowWidth, breakpoints.contentMaxWidth) - spacing.md * 2;
  return Math.floor(column - spacing['2xl'] - spacing.md * 2 - BUBBLE_BORDER * 2);
}

function currentTurnAnchor(answerCount: number) {
  return ['moving-0', 'recognition-0', 'acknowledgment', 'plan-0', 'room-0'][Math.min(answerCount, 4)];
}

export default function AzoChatScreen({
  answers,
  onAnswersChange,
  onContinue,
  onBack,
}: AzoChatScreenProps) {
  const insets = useSafeAreaInsets();
  const textWidth = bubbleTextWidth(useWindowDimensions().width);
  const scroll = useRef<ScrollView>(null);
  const continuing = useRef(false);
  const conversation = getAzoConversation(answers);
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
    const nextAnswers = chooseAzoReply(latestAnswers.current, replyId);
    if (!nextAnswers) return;
    latestAnswers.current = nextAnswers;
    onAnswersChange(nextAnswers);
    if (getAzoConversation(nextAnswers).complete) {
      continueToPlan();
    }
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

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerBorder}>
        <View style={[styles.column, styles.header]}>
          <AzoChatBackButton onPress={goBack} />
          <AzoChatAvatar />
          <View style={styles.identity}>
            <Text accessibilityRole="header" style={styles.name}>Azo</Text>
            <View style={styles.status}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineLabel}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      {/*
        The authored transcript is capped at four turns; it cannot grow with user
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
        onScrollBeginDrag={() => {
          atEnd.current = false;
        }}
        onScrollEndDrag={settleAtEnd}
        onMomentumScrollEnd={settleAtEnd}
        contentContainerStyle={[
          styles.column,
          styles.transcript,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md },
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
                  {message.id === 'moving-1' ? (
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
            <Text style={styles.choiceHint}>Tap to choose an answer</Text>
            {conversation.replies.map((reply) => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azoChatColors.background },
  column: { ...contentColumn, paddingHorizontal: spacing.md },
  headerBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: azoChatColors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  identity: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.semibold, fontSize: scaleType(24), lineHeight: scaleType(28), color: azoChatColors.ink },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: azoChatColors.accent },
  onlineLabel: { fontSize: scaleType(18), lineHeight: scaleType(22), color: azoChatColors.muted },
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
  typing: { alignSelf: 'flex-start', paddingVertical: spacing.md },
  pressed: { opacity: 0.65 },
});
