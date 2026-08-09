import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import RoomPager from '../features/room/RoomPager';
import { HexRoom } from '../features/room/RoomScene';
import { ROOM_SHELLS, ROOM_STYLES, type RoomStyle } from '../features/room/roomShells';
import { getRoomWidth } from '../features/room/roomLayout';
import { useCreateNextRoomMutation } from '../queries/room/useCreateNextRoomMutation';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../stores/authStore';
import { triggerTapHaptic } from '../native/tapHaptics';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import type { NextRoomScreenProps } from '../app/navigation';

/**
 * Picking the next room to live in.
 *
 * Full-width pages rather than a row of swatches: the look is the whole reward
 * for the next seven days, and a 90pt thumbnail cannot show the difference
 * between a plank floor and a checker one.
 */
export default function NextRoomScreen({ navigation }: NextRoomScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;
  const createNextRoom = useCreateNextRoomMutation(userId);
  const [style, setStyle] = useState<RoomStyle>(ROOM_STYLES[0]);

  const roomWidth = getRoomWidth(width);
  const nextFloor = (currentRoom?.room?.floor ?? 1) + 1;

  const openNextRoom = () => {
    if (createNextRoom.isPending) return;

    triggerTapHaptic();
    createNextRoom.mutate(
      { shell: style.shell, frameHue: style.frameHue },
      {
        // Home rather than the picker: the new room is empty and today is
        // already spent, so there would be nothing to do there.
        onSuccess: () => navigation.navigate('MainTabs', { screen: 'Home' }),
      },
    );
  };

  return (
    <View style={styles.screen}>
      <AppTopBar showAvatar={false} showStreak={false} />

      <View style={styles.header}>
        <Text style={styles.title}>Pick your next room</Text>
        <Text style={styles.note}>
          Swipe to look around. Seven more pieces to fill it.
        </Text>
      </View>

      <View style={styles.body}>
        <RoomPager<RoomStyle>
          items={ROOM_STYLES}
          pageWidth={width}
          keyOf={(option) => option.shell}
          captionOf={(option) => option.name}
          onIndexChange={(index) => setStyle(ROOM_STYLES[index])}
          renderItem={(option) => (
            <HexRoom
              width={roomWidth}
              frameHue={option.frameHue}
              shell={ROOM_SHELLS[option.shell]}
            />
          )}
        />
      </View>

      <View style={styles.tray}>
        <Pressable
          style={styles.primaryButton}
          disabled={createNextRoom.isPending}
          onPress={openNextRoom}
        >
          <Text style={styles.primaryButtonLabel}>
            {createNextRoom.isPending ? 'Opening…' : `Open room ${nextFloor}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing['2xl'],
    gap: spacing.xs,
  },
  title: {
    ...typography.display.display3,
    color: colors.text.primary,
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  tray: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: margin.sectionGap,
  },
  primaryButton: {
    ...card.shadow,
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
