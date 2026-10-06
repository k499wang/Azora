import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Reanimated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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
import { duration, easing, spring } from "../../../theme/motion";
import { triggerSuccessHaptic } from "../../../native/tapHaptics";
import { startUiTimer } from "../../../lib/ui/uiThreadTimer";
import OnboardingScreenLayout from "../OnboardingScreenLayout";
import OnboardingPrimaryButton from "../OnboardingPrimaryButton";

const TRACK_HEIGHT = 340;
const ALONE_FILL_RATIO = 0.3;
const AZORA_FILL_RATIO = 0.72;
const LIP_DEPTH = 6;
const BADGE_LIP_DEPTH = 4;

const ALONE_START_MS = 220;
// "On your own" climbs slowly and stalls; Azora waits for that to read, then
// shoots past it with an overshoot so the gap lands as a jump, not a fact.
const AZORA_START_MS = ALONE_START_MS + 560;
const BADGE_AT_MS = AZORA_START_MS + duration.fill;

interface BarTone {
  face: string;
  lip: string;
  label: string;
}

const ALONE_TONE: BarTone = {
  face: colors.playful.coral.mid,
  lip: colors.playful.coral.base,
  label: colors.playful.coral.ink,
};

const AZORA_TONE: BarTone = {
  face: colors.playful.teal.base,
  lip: colors.playful.teal.ink,
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
  const alone = useSharedValue(0);
  const azora = useSharedValue(0);
  const badge = useSharedValue(0);

  useEffect(() => {
    alone.value = withDelay(
      ALONE_START_MS,
      withTiming(1, { duration: duration.fill, easing: easing.settle }),
    );
    azora.value = withDelay(
      AZORA_START_MS,
      withTiming(1, {
        duration: duration.fill,
        easing: Easing.out(Easing.back(1.6)),
      }),
    );
    badge.value = withDelay(BADGE_AT_MS, withSpring(1, spring.bounce));
    return startUiTimer(BADGE_AT_MS, triggerSuccessHaptic);
  }, [alone, azora, badge]);

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
            ratio={ALONE_FILL_RATIO}
            tone={ALONE_TONE}
            label={"On\nyour own"}
          />
          <Bar
            progress={azora}
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

interface BarProps {
  progress: SharedValue<number>;
  ratio: number;
  tone: BarTone;
  label: string;
  badge?: SharedValue<number>;
}

function Bar({ progress, ratio, tone, label, badge }: BarProps) {
  const fillStyle = useAnimatedStyle(() => ({
    height: progress.value * TRACK_HEIGHT * ratio,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const badgeStyle = useAnimatedStyle(() => {
    const pop = badge?.value ?? 0;
    return {
      opacity: Math.min(1, pop * 2),
      transform: [{ scale: 0.4 + pop * 0.6 }],
    };
  });

  return (
    <View style={styles.track}>
      {badge ? (
        <Reanimated.View
          style={[
            styles.badgeAnchor,
            { bottom: TRACK_HEIGHT * ratio + spacing.md },
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
  // Anchored to the track's floor so the growth reads as a bar filling up
  // rather than a block sliding in under the label. The lip is bottom padding
  // in a darker tone, the same face-on-a-lip build as `ChunkyButton`.
  fill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: LIP_DEPTH,
    borderRadius: radius.card,
    borderCurve: "continuous",
    overflow: "hidden",
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
    backgroundColor: colors.playful.teal.tintDeep,
  },
  badgeFace: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.playful.teal.soft,
  },
  badgeText: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.playful.teal.ink,
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
