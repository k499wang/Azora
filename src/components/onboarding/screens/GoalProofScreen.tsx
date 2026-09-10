import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "../../common/Text";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { card, radius } from "../../../theme/card";
import { fonts, typography } from "../../../theme/typography";
import { isHapticsEnabled } from "../../../services/preferences/hapticsPreference";
import OnboardingScreenLayout from "../OnboardingScreenLayout";
import OnboardingPrimaryButton from "../OnboardingPrimaryButton";

const TRACK_HEIGHT = 300;
const ALONE_FILL_RATIO = 0.3;
const AZORA_FILL_RATIO = 0.6;

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
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <View style={styles.bars}>
              <Bar
                grow={grow}
                ratio={ALONE_FILL_RATIO}
                track={colors.playful.coral.soft}
                fill={colors.playful.coral.base}
                labelColor={colors.playful.coral.ink}
                label={'On\nyour own'}
                value="1×"
              />
              <Bar
                grow={grow}
                ratio={AZORA_FILL_RATIO}
                track={colors.playful.amber.soft}
                fill={colors.playful.amber.base}
                labelColor={colors.playful.amber.ink}
                label={'With\nAzora'}
                value="2×"
              />
            </View>
          </View>
        </View>

        <Text style={styles.note}>
          Azora decides what you do and when you do it, then holds you to it —
          so reaching your goal stops depending on how you feel that day.
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

interface BarProps {
  grow: Animated.Value;
  ratio: number;
  track: string;
  fill: string;
  labelColor: string;
  label: string;
  value: string;
}

function Bar({ grow, ratio, track, fill, labelColor, label, value }: BarProps) {
  const height = grow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_HEIGHT * ratio],
  });

  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <Text style={[styles.barLabel, { color: labelColor }]}>{label}</Text>
      <Animated.View style={[styles.fill, { height, backgroundColor: fill }]}>
        <Animated.Text style={[styles.barValue, { opacity: grow }]}>
          {value}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.xl,
  },
  cardShadow: {
    ...card.shadow,
    borderRadius: radius.card,
    marginTop: spacing["2xl"],
  },
  card: {
    ...card.base,
    padding: spacing.md,
  },
  bars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
  },
  track: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderRadius: radius.card,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingTop: spacing.lg,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  barLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
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
  barValue: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
