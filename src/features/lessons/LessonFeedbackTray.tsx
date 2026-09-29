import { StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  useReducedMotion,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
} from "react-native-reanimated";
import ChunkyButton from "../../components/common/ChunkyButton";
import ScreenContent from "../../components/common/ScreenContent";
import { Text } from "../../components/common/Text";
import { card, radius } from "../../theme/card";
import { colors } from "../../theme/colors";
import { duration, easing } from "../../theme/motion";
import { padding, spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface Props {
  feedback: { label?: string; text: string } | null;
  /** Changes when the answer does, so only the message cross-fades, not the tray. */
  feedbackKey: string | number;
  buttonLabel: string;
  onPress: () => void;
  bottomInset: number;
  onHeight: (height: number) => void;
}

/**
 * Rises exactly its own height, on a transform.
 *
 * The stock `SlideInDown` starts a full window below and moves the view's
 * frame, so a short tray crosses most of the screen in a quarter second and
 * lays itself out every frame. A transform is composited on the UI thread and
 * never re-lays anything out. Timed on a curve with no overshoot, because a
 * spring's bounce would lift the tray off the bottom edge and show the gap.
 */
function trayEntering(values: EntryAnimationsValues) {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: values.targetHeight }] },
    animations: {
      transform: [
        {
          translateY: withTiming(0, {
            duration: duration.slow,
            easing: easing.settle,
          }),
        },
      ],
    },
  };
}

function trayExiting(values: ExitAnimationsValues) {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: 0 }] },
    animations: {
      transform: [
        {
          translateY: withTiming(values.currentHeight, {
            duration: duration.fast,
            easing: easing.exit,
          }),
        },
      ],
    },
  };
}

/**
 * What an answered activity says back, docked to the bottom of the screen.
 *
 * It rises over the page rather than being added to it, so the question and
 * the answers stay exactly where the reader's finger left them.
 */
export default function LessonFeedbackTray({
  feedback,
  feedbackKey,
  buttonLabel,
  onPress,
  bottomInset,
  onHeight,
}: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reducedMotion ? FadeIn.duration(duration.fast) : trayEntering}
      exiting={reducedMotion ? FadeOut.duration(duration.fast) : trayExiting}
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
      style={[
        styles.tray,
        card.trayShadow,
        { paddingBottom: bottomInset + spacing.md },
      ]}
    >
      {/* The first message arrives with the tray; only a changed answer fades. */}
      <LayoutAnimationConfig skipEntering>
        <ScreenContent width="grouped" style={styles.content}>
          {feedback != null ? (
            <Animated.View
              key={feedbackKey}
              entering={
                reducedMotion ? undefined : FadeIn.duration(duration.fast)
              }
              style={styles.message}
              accessibilityLiveRegion="polite"
            >
              {feedback.label != null ? (
                <Text style={styles.label}>{feedback.label}</Text>
              ) : null}
              <Text style={styles.text}>{feedback.text}</Text>
            </Animated.View>
          ) : null}
          <ChunkyButton label={buttonLabel} shape="card" onPress={onPress} />
        </ScreenContent>
      </LayoutAnimationConfig>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tray: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.playful.teal.soft,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: "continuous",
    paddingTop: spacing.lg,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
  },
  message: {
    gap: spacing.xs,
  },
  label: {
    ...typography.overline,
    color: colors.playful.teal.ink,
    textAlign: "center",
  },
  text: {
    ...typography.body.medium,
    color: colors.playful.teal.ink,
    textAlign: "center",
  },
});
