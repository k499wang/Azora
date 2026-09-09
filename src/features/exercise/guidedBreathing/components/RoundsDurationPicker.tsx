import { Text } from "../../../../components/common/Text";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { radius } from "../../../../theme/card";
import { spacing } from "../../../../theme/spacing";
import { fonts, typography } from "../../../../theme/typography";
import { isHapticsEnabled } from "../../../../services/preferences/hapticsPreference";
import type { ExerciseDarkTheme } from "../../../../theme/exerciseDarkThemes";
import type { RoundsDurationOption } from "../domain/roundsDurationOptions";

interface Props {
  options: RoundsDurationOption[];
  value: number;
  onChange: (rounds: number) => void;
  theme: ExerciseDarkTheme;
}

const OPEN_DURATION_MS = 220;
const CLOSE_DURATION_MS = 160;
const SLIDE_DISTANCE = 10;

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function RoundsDurationPicker({
  options,
  value,
  onChange,
  theme,
}: Props) {
  const [open, setOpen] = useState(false);
  // The menu has to stay mounted through the closing animation, so mounting is
  // driven by the animation finishing rather than by `open` directly.
  const [mounted, setMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const selected =
    options.find((option) => option.rounds === value) ?? options[0];

  useEffect(() => {
    if (open) setMounted(true);

    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? OPEN_DURATION_MS : CLOSE_DURATION_MS,
      easing: open ? Easing.out(Easing.back(1.4)) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });

    return () => animation.stop();
  }, [open, progress]);

  const tap = () => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
  };

  const select = (rounds: number) => {
    if (isHapticsEnabled())
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setOpen(false);
    if (rounds !== value) onChange(rounds);
  };

  const menuStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-SLIDE_DISTANCE, 0],
        }),
      },
    ],
  };

  const chevronStyle = {
    transform: [
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  return (
    <View style={styles.anchor}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Session length, ${selected.label}`}
        onPress={() => {
          tap();
          setOpen((wasOpen) => !wasOpen);
        }}
        hitSlop={8}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: theme.controlSurface,
            borderColor: theme.controlBorder,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {selected.label}
        </Text>
        <AnimatedSvg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          style={chevronStyle}
        >
          <Path
            d="M6 9 L12 15 L18 9"
            stroke={theme.textTertiary}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </AnimatedSvg>
      </Pressable>

      {mounted ? (
        <Animated.View
          pointerEvents={open ? "auto" : "none"}
          style={[
            styles.menu,
            {
              backgroundColor: theme.controlSurface,
              borderColor: theme.controlBorder,
            },
            menuStyle,
          ]}
        >
          {options.map((option) => {
            const isSelected = option.rounds === selected.rounds;

            return (
              <Pressable
                key={option.rounds}
                accessibilityRole="button"
                onPress={() => select(option.rounds)}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text
                  style={[
                    styles.label,
                    {
                      color: isSelected
                        ? theme.textAccent
                        : theme.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignItems: "center",
    zIndex: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  // The intro block is centred in the screen, so the open menu hangs over the
  // technique name rather than pushing it down.
  menu: {
    position: "absolute",
    top: "100%",
    marginTop: spacing.xs,
    minWidth: 104,
    borderRadius: radius.medium,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    elevation: 6,
  },
  menuItem: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
  },
});
