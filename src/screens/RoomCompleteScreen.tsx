import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { HexRoom } from '../features/room/RoomScene';
import RoomReplay from '../features/room/RoomReplay';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import {
  ROOM_SHELLS,
  ROOM_STYLES,
  roomShellPolys,
  toRoomShell,
  type RoomStyle,
} from '../features/room/roomShells';
import { useCreateNextRoomMutation } from '../queries/room/useCreateNextRoomMutation';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../stores/authStore';
import { triggerTapHaptic } from '../native/tapHaptics';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import type { RoomCompleteScreenProps } from '../app/navigation';

const MAX_ROOM_WIDTH = 320;
const SWATCH_COLUMNS = 3;

export default function RoomCompleteScreen({
  navigation,
}: RoomCompleteScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;
  const createNextRoom = useCreateNextRoomMutation(userId);

  const room = currentRoom?.room;
  const currentShell = toRoomShell(room?.shell);
  // Open on a look they are not already living in, so the next room reads as a
  // new place rather than a repeat of the one they just finished.
  const [style, setStyle] = useState<RoomStyle>(
    () => ROOM_STYLES.find((it) => it.shell !== currentShell) ?? ROOM_STYLES[0],
  );

  const [replayDone, setReplayDone] = useState(false);
  const reveal = useSharedValue(0);

  useEffect(() => {
    if (!replayDone) return;
    reveal.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [replayDone, reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 14 }],
  }));

  const contentWidth = width - padding.screen.horizontal * 2;
  const roomWidth = Math.min(contentWidth, MAX_ROOM_WIDTH);
  const swatchWidth =
    (contentWidth - spacing.sm * (SWATCH_COLUMNS - 1)) / SWATCH_COLUMNS;

  const openNextRoom = () => {
    if (createNextRoom.isPending) return;

    triggerTapHaptic();
    createNextRoom.mutate(
      { shell: style.shell, frameHue: style.frameHue },
      {
        // Back to Home rather than the picker: the next room is empty and today
        // is already claimed, so there would be nothing to do there.
        onSuccess: () => navigation.navigate('MainTabs', { screen: 'Home' }),
      },
    );
  };

  return (
    <View style={styles.screen}>
      <AppTopBar showAvatar={false} showStreak={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, revealStyle]}>
          <Text style={styles.title}>You filled every corner</Text>
        </Animated.View>

        <View style={styles.stage}>
          <RoomReplay
            width={roomWidth}
            picks={toPicks(room?.decorations ?? [])}
            frameHue={toFrameHue(room?.frameHue)}
            shell={roomShellPolys(room?.shell)}
            onDone={() => setReplayDone(true)}
          />
        </View>

        <Animated.View style={[styles.section, revealStyle]}>
          <Text style={styles.sectionTitle}>Pick your next room</Text>
          <Text style={styles.sectionNote}>
            Each look has its own walls and floor. Seven more pieces to fill
            it.
          </Text>
          <View style={styles.swatchRow}>
            {ROOM_STYLES.map((option) => {
              const selected = option.shell === style.shell;

              return (
                <Pressable
                  key={option.shell}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.swatch,
                    { width: swatchWidth },
                    selected && styles.swatchSelected,
                  ]}
                  onPress={() => {
                    triggerTapHaptic();
                    setStyle(option);
                  }}
                >
                  <HexRoom
                    width={swatchWidth - spacing.md}
                    frameHue={option.frameHue}
                    shell={ROOM_SHELLS[option.shell]}
                  />
                  <Text
                    style={[
                      styles.swatchLabel,
                      selected && styles.swatchLabelSelected,
                    ]}
                  >
                    {option.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View style={revealStyle}>
          <Pressable
            style={styles.primaryButton}
            disabled={createNextRoom.isPending}
            onPress={openNextRoom}
          >
            <Text style={styles.primaryButtonLabel}>
              {createNextRoom.isPending
                ? 'Opening…'
                : `Open room ${(room?.floor ?? 1) + 1}`}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingBottom: spacing['7xl'],
    gap: margin.sectionGap,
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  sectionNote: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  swatch: {
    ...card.base,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.primary.blue600,
  },
  swatchLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  swatchLabelSelected: {
    color: colors.primary.blue700,
  },
  primaryButton: {
    ...card.shadow,
    marginHorizontal: padding.screen.horizontal,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary.blue600,
  },
  primaryButtonLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
});
