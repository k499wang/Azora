import { useRef } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../common/Text';
import { HexRoom, type Picks } from '../../../features/room/RoomScene';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import { contentColumn } from '../../../theme/breakpoints';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType } from '../../../theme/typography';
import { AzoChatAvatar, AzoChatBackButton, azoChatColors } from '../AzoChatChrome';
import { chooseAzoReply, getAzoConversation } from '../data/azoConversation';

interface AzoChatScreenProps {
  answers: readonly string[];
  onAnswersChange: (answers: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

const ROOM_PREVIEW_PICKS: Picks = {
  day1: 'checker_rug',
  day2: 'study_desk',
};

function currentTurnAnchor(answerCount: number) {
  return ['recognition-0', 'acknowledgment', 'plan-0', 'room-0'][Math.min(answerCount, 3)];
}

export default function AzoChatScreen({
  answers,
  onAnswersChange,
  onContinue,
  onBack,
}: AzoChatScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const scroll = useRef<ScrollView>(null);
  const continuing = useRef(false);
  const conversation = getAzoConversation(answers);
  const latestAnswers = useRef(conversation.answers);
  latestAnswers.current = conversation.answers;
  const pendingAnchor = useRef<string | undefined>(currentTurnAnchor(conversation.answers.length));
  const anchorPositions = useRef(new Map<string, number>());

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
    onContinue();
  };

  const chooseReply = (replyId: string) => {
    if (continuing.current) return;
    // Validate against the synchronous answer ref as well as the rendered turn.
    // A second tap on a disappearing option must not advance another turn.
    const nextAnswers = chooseAzoReply(latestAnswers.current, replyId);
    if (!nextAnswers) return;
    latestAnswers.current = nextAnswers;
    onAnswersChange(nextAnswers);
    if (getAzoConversation(nextAnswers).complete) {
      continueToPlan();
    } else {
      // The next group needs to lay out before scrolling, including after Back.
      const anchor = currentTurnAnchor(nextAnswers.length);
      anchorPositions.current.delete(anchor);
      pendingAnchor.current = anchor;
    }
  };

  const goBack = () => {
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

  const roomWidth = Math.min(width - spacing.md * 4, 280);

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

      {/* The authored transcript is capped at four turns; it cannot grow with user history. */}
      <ScrollView
        ref={scroll}
        style={styles.scroll}
        contentContainerStyle={[
          styles.column,
          styles.transcript,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md },
        ]}
        onContentSizeChange={() => {
          const anchor = pendingAnchor.current;
          const y = anchor === undefined ? undefined : anchorPositions.current.get(anchor);
          if (y === undefined) return;
          scroll.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: false });
          pendingAnchor.current = undefined;
        }}
      >
        {conversation.messages.map((message) => {
          const isReply = message.kind === 'reply';
          const canContinue = conversation.complete && message.id === 'room-reply';
          return (
            <View
              key={message.id}
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
              {message.kind === 'room' ? (
                <View
                  style={[styles.bubble, styles.roomBubble]}
                  accessible
                  accessibilityLabel="A preview of Azo’s room with a colorful rug and a desk. Complete your daily plan to earn your own decorations."
                >
                  <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                    <HexRoom width={roomWidth} picks={ROOM_PREVIEW_PICKS} />
                  </View>
                </View>
              ) : canContinue ? (
                <Pressable
                  onPress={continueToPlan}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to make my Life Reset Plan"
                  style={({ pressed }) => [styles.bubble, styles.replyBubble, pressed && styles.pressed]}
                >
                  <Text style={[styles.message, styles.replyText]}>{message.text}</Text>
                </Pressable>
              ) : (
                <View style={[styles.bubble, isReply && styles.replyBubble]}>
                  <Text style={[styles.message, isReply && styles.replyText]}>{message.text}</Text>
                </View>
              )}
            </View>
          );
        })}

        {conversation.replies.length > 0 ? (
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
                <Text style={[styles.message, styles.replyText]}>{reply.label}</Text>
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
  headerBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: azoChatColors.bubble },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  identity: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.semibold, fontSize: scaleType(24), lineHeight: scaleType(28), color: azoChatColors.ink },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: azoChatColors.green },
  onlineLabel: { fontSize: scaleType(18), lineHeight: scaleType(22), color: azoChatColors.muted },
  scroll: { flex: 1 },
  transcript: { paddingTop: spacing.lg, gap: spacing.sm + spacing.xs },
  messageRow: { alignItems: 'flex-start' },
  replyRow: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '88%',
    backgroundColor: azoChatColors.bubble,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  message: { fontSize: scaleType(23), lineHeight: scaleType(29), color: azoChatColors.ink },
  replyBubble: { backgroundColor: azoChatColors.reply },
  replyText: { color: azoChatColors.greenInk },
  roomBubble: { maxWidth: '100%', paddingHorizontal: spacing.sm, paddingVertical: spacing.md },
  choices: { marginTop: spacing.lg, alignItems: 'flex-end', gap: spacing.sm + spacing.xs },
  choiceHint: { fontSize: scaleType(16), lineHeight: scaleType(21), color: azoChatColors.muted },
  choice: { alignSelf: 'flex-end', minHeight: 48 },
  pressed: { opacity: 0.65 },
});
