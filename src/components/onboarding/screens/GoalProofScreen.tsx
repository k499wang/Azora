import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "../../common/Text";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { radius } from "../../../theme/card";
import { fonts, typography } from "../../../theme/typography";
import { isHapticsEnabled } from "../../../services/preferences/hapticsPreference";
import OnboardingScreenLayout from "../OnboardingScreenLayout";
import OnboardingPrimaryButton from "../OnboardingPrimaryButton";

const TRACK_HEIGHT = 340;
const ALONE_FILL_RATIO = 0.3;
const AZORA_FILL_RATIO = 0.72;

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
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    Animated.timing(grow, {
      toValue: 1,
      duration: 760,
      delay: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [grow]);

  return (
    <OnboardingScreenLayout
      title="Azora users are 2× more likely to reach the goal they set"
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody
      animateCopy
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.body}>
        <View style={styles.bars}>
          <Bar
            grow={grow}
            ratio={ALONE_FILL_RATIO}
            fill={colors.neutral[500]}
            label={'On\nyour own'}
          />
          <Bar
            grow={grow}
            ratio={AZORA_FILL_RATIO}
            fill={colors.primary.blue600}
            label={'With\nAzora'}
            marker="2×"
            markerColor={colors.primary.blue700}
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
  grow: Animated.Value;
  ratio: number;
  fill: string;
  label: string;
  marker?: string;
  markerColor?: string;
}

function Bar({
  grow,
  ratio,
  fill,
  label,
  marker,
  markerColor,
}: BarProps) {
  const height = grow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_HEIGHT * ratio],
  });
  const markerBottom = Animated.add(height, 8);

  return (
    <View style={styles.track}>
      {marker ? (
        <Animated.Text
          style={[
            styles.marker,
            { bottom: markerBottom, color: markerColor, opacity: grow },
          ]}
        >
          {marker}
        </Animated.Text>
      ) : null}
      <Animated.View style={[styles.fill, { height, backgroundColor: fill }]}>
        <Animated.Text style={[styles.barLabel, { opacity: grow }]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.xl,
  },
  bars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing["2xl"],
  },
  track: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderRadius: radius.card,
    borderCurve: "continuous",
  },
  barLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 27,
    textAlign: "center",
    color: colors.text.inverse,
  },
  // Anchored to the track's floor so the growth reads as a bar filling up
  // rather than a block sliding in under the label.
  fill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.card,
    borderCurve: "continuous",
    justifyContent: "center",
    alignItems: "center",
  },
  marker: {
    position: "absolute",
    left: 0,
    right: 0,
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 38,
    lineHeight: 44,
    textAlign: "center",
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
