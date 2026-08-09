import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../components/common/Text';
import RoomScreenLayout from '../features/room/RoomScreenLayout';
import RoomPager from '../features/room/RoomPager';
import { HexRoom } from '../features/room/RoomScene';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { getRoomWidth } from '../features/room/roomLayout';
import { useRoomsQuery } from '../queries/room/useRoomsQuery';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { Room } from '../services/room/roomService';
import type { HotelScreenProps } from '../app/navigation';

/**
 * Every floor the user has finished, one per page.
 *
 * Opens on the newest floor rather than the ground floor — the room they most
 * recently spent seven days on is the one worth landing on.
 */
export default function HotelScreen(_: HotelScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const roomsQuery = useRoomsQuery(userId);
  const rooms = roomsQuery.data ?? [];
  const roomWidth = getRoomWidth(width);

  return (
    <RoomScreenLayout
      title="Your hotel"
      note="Every room you have finished. Swipe to look through them."
    >
      {roomsQuery.isPending ? null : rooms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No floors yet</Text>
          <Text style={styles.emptyBody}>
            Finish today's dailies to earn your first piece. Seven of them fill
            a room, and a filled room opens here.
          </Text>
        </View>
      ) : (
        <RoomPager<Room>
          items={rooms}
          pageWidth={width}
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
    </RoomScreenLayout>
  );
}

const styles = StyleSheet.create({
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
});
