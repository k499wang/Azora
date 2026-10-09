import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Text } from "../../common/Text";
import { colors } from "../../../theme/colors";
import { isShortScreen } from "../../../theme/breakpoints";
import { spacing } from "../../../theme/spacing";
import { radius } from "../../../theme/card";
import { fonts, typography } from "../../../theme/typography";
import { duration, easing, spring, travel } from "../../../theme/motion";
import { triggerSuccessHaptic } from "../../../native/tapHaptics";
import { startUiTimer } from "../../../lib/ui/uiThreadTimer";
import OnboardingScreenLayout from "../OnboardingScreenLayout";
import OnboardingPrimaryButton from "../OnboardingPrimaryButton";

const TRACK_HEIGHT = 340;
const ALONE_FILL_RATIO = 0.3;
const AZORA_FILL_RATIO = 0.72;
const LIP_DEPTH = 6;
const BADGE_LIP_DEPTH = 4;

const ALONE_START_MS = 250;
const AZORA_START_MS = ALONE_START_MS + 320;
const AZORA_RISE_MS = duration.fill + 200;
// Each bar plops onto its height: a quick squash, then a jelly wobble back.
const SQUASH_MS = 110;
const BADGE_AT_MS = AZORA_START_MS + AZORA_RISE_MS + 60;

interface BarTone {
  face: string;
  lip: string;
  label: string;
}

// The quiet, deliberately-not-a-colour option, so the only hue on screen is
// Azora's blue — the same face and lip as the Continue button below.
const ALONE_TONE: BarTone = {
  face: colors.playful.stone.soft,
  lip: colors.playful.stone.tint,
  label: colors.playful.stone.ink,
};

const AZORA_TONE: BarTone = {
  face: colors.primary.blue500,
  lip: colors.primary.blue700,
  label: colors.text.inverse,
};

interface GoalProofScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function GoalProofScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: GoalProofScreenProps) {
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);
  const reducedMotion = useReducedMotion();
  const alone = useSharedValue(0);
  const aloneSquish = useSharedValue(0);
  const azora = useSharedValue(0);
  const azoraSquish = useSharedValue(0);
  const badge = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      alone.value = 1;
      azora.value = 1;
      badge.value = 1;
      return undefined;
    }
    rise(alone, aloneSquish, ALONE_START_MS, duration.fill);
    rise(azora, azoraSquish, AZORA_START_MS, AZORA_RISE_MS);
    badge.value = withDelay(BADGE_AT_MS, withSpring(1, spring.pop));
    return startUiTimer(BADGE_AT_MS, triggerSuccessHaptic);
  }, [alone, aloneSquish, azora, azoraSquish, badge, reducedMotion]);

  return (
    <OnboardingScreenLayout
      title="Reach your goals 2× faster with Azora than on your own"
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody={!compact}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={[styles.body, compact && styles.bodyCompact]}>
        <View style={[styles.bars, compact && styles.barsCompact]}>
          <Bar
            progress={alone}
            squish={aloneSquish}
            ratio={ALONE_FILL_RATIO}
            tone={ALONE_TONE}
            label={"On\nyour own"}
          />
          <Bar
            progress={azora}
            squish={azoraSquish}
            ratio={AZORA_FILL_RATIO}
            tone={AZORA_TONE}
            label={"With\nAzora"}
            badge={badge}
          />
        </View>

        <Text style={styles.note}>
          On your own, motivation fades. With Azora, your plan adapts to you —
          gently holding you to what matters most.
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

function rise(
  progress: SharedValue<number>,
  squish: SharedValue<number>,
  startMs: number,
  riseMs: number,
) {
  progress.value = withDelay(
    startMs,
    withTiming(1, { duration: riseMs, easing: easing.enter }),
  );
  squish.value = withDelay(
    startMs + riseMs - SQUASH_MS / 2,
    withSequence(
      withTiming(1, { duration: SQUASH_MS, easing: easing.enter }),
      withSpring(0, spring.bounce),
    ),
  );
}

interface BarProps {
  progress: SharedValue<number>;
  squish: SharedValue<number>;
  ratio: number;
  tone: BarTone;
  label: string;
  badge?: SharedValue<number>;
}

function Bar({ progress, squish, ratio, tone, label, badge }: BarProps) {
  const barHeight = TRACK_HEIGHT * ratio;
  // Transform-only: the bar slides up inside a fixed slot instead of animating
  // height, so the growth runs on the UI thread without relayout every frame.
  const slotStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: 1 - squish.value * 0.07 },
      { scaleX: 1 + squish.value * 0.04 },
    ],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * barHeight }],
  }));
  const labelStyle = useAnimatedStyle(() => {
    const shown = interpolate(
      progress.value,
      [0.6, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: shown,
      transform: [
        { translateY: (1 - shown) * travel.rise },
        { scale: 0.85 + shown * 0.15 },
      ],
    };
  });
  const badgeStyle = useAnimatedStyle(() => {
    const pop = badge?.value ?? 0;
    return {
      opacity: Math.min(1, pop * 2),
      transform: [{ scale: pop }],
    };
  });

  return (
    <View style={styles.track}>
      {badge ? (
        <Reanimated.View
          style={[
            styles.badgeAnchor,
            { bottom: barHeight + spacing.md },
            badgeStyle,
          ]}
        >
          <View style={styles.badgeLip}>
            <View style={styles.badgeFace}>
              <Text style={styles.badgeText}>2×</Text>
            </View>
          </View>
        </Reanimated.View>
      ) : null}
      <Reanimated.View style={[styles.slot, { height: barHeight }, slotStyle]}>
        <Reanimated.View
          style={[styles.fill, { backgroundColor: tone.lip }, fillStyle]}
        >
          <View style={[styles.face, { backgroundColor: tone.face }]}>
            <Reanimated.View style={labelStyle}>
              <Text style={[styles.barLabel, { color: tone.label }]}>
                {label}
              </Text>
            </Reanimated.View>
          </View>
        </Reanimated.View>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.xl,
  },
  bodyCompact: {
    gap: spacing.lg,
    marginTop: -spacing["2xl"],
  },
  bars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing["2xl"],
  },
  barsCompact: {
    marginTop: 0,
  },
  track: {
    flex: 1,
    height: TRACK_HEIGHT,
  },
  // Anchored to the track's floor and squashing from there, so the bar reads
  // as landing on the ground rather than shrinking toward its middle.
  slot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.card,
    borderCurve: "continuous",
    overflow: "hidden",
    transformOrigin: "bottom",
  },
  // The lip is bottom padding in a darker tone, the same face-on-a-lip build
  // as `ChunkyButton`.
  fill: {
    flex: 1,
    paddingBottom: LIP_DEPTH,
    borderRadius: radius.card,
    borderCurve: "continuous",
  },
  face: {
    flex: 1,
    borderRadius: radius.card,
    borderCurve: "continuous",
    justifyContent: "center",
    alignItems: "center",
  },
  barLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 27,
    textAlign: "center",
  },
  badgeAnchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  badgeLip: {
    paddingBottom: BADGE_LIP_DEPTH,
    borderRadius: radius.full,
    backgroundColor: colors.primary.blue300,
  },
  badgeFace: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primary.blue100,
  },
  badgeText: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.primary.blue800,
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
