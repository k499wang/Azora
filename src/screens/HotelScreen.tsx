import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import RoomPager from '../features/room/RoomPager';
import { HexRoom } from '../features/room/RoomScene';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { getRoomWidth } from '../features/room/roomLayout';
import { useRoomsQuery } from '../queries/room/useRoomsQuery';
import { useAuthStore } from '../stores/authStore';
import { triggerTapHaptic } from '../native/tapHaptics';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import type { Room } from '../services/room/roomService';
import type { HotelScreenProps } from '../app/navigation';

/**
 * Every floor the user has finished, one per page.
 *
 * Reached two ways: on its own, and as the middle beat of finishing a room —
 * where it opens on the floor they just completed so the room they spent seven
 * days on is the one they are looking at.
 */
export default function HotelScreen({ navigation, route }: HotelScreenProps) {
  const fromCompletion = route.params?.fromCompletion ?? false;
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const roomsQuery = useRoomsQuery(userId);
  const rooms = roomsQuery.data ?? [];
  const roomWidth = getRoomWidth(width);

  const openNextRoom = () => {
    triggerTapHaptic();
    navigation.navigate('NextRoom');
  };

  return (
    <View style={styles.screen}>
      <AppTopBar showAvatar={false} showStreak={false} />

      <View style={styles.header}>
        <Text style={styles.title}>Your hotel</Text>
        <Text style={styles.note}>
          Every room you have finished. Swipe to look through them.
        </Text>
      </View>

      <View style={styles.body}>
        {roomsQuery.isPending ? null : rooms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No floors yet</Text>
            <Text style={styles.emptyBody}>
              Finish today's dailies to earn your first piece. Seven of them
              fill a room, and a filled room opens here.
            </Text>
          </View>
        ) : (
          <RoomPager<Room>
            items={rooms}
            pageWidth={width}
            // Land on the newest floor, which is the one they just finished.
            initialIndex={rooms.length - 1}
            keyOf={(room) => room.id}
            captionOf={(room) => `Room ${room.floor}`}
            renderItem={(room) => (
              <HexRoom
                width={roomWidth}
                picks={toPicks(room.decorations)}
                frameHue={toFrameHue(room.frameHue)}
                shell={roomShellPolys(room.shell)}
              />
            )}
          />
        )}
      </View>

      {fromCompletion ? (
        <View style={styles.tray}>
          <Pressable style={styles.primaryButton} onPress={openNextRoom}>
            <Text style={styles.primaryButtonLabel}>Continue</Text>
          </Pressable>
        </View>
      ) : null}
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
  empty: {
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  emptyBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
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
