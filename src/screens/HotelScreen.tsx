import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-screens/experimental';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import PyramidCanvas from '../features/room/PyramidCanvas';
import type { PyramidRoom } from '../features/room/PyramidCanvas';
import { useOpenedFromLab } from '../features/room/useOpenedFromLab';
import { useHotelOverride } from '../features/room/devHotelOverride';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { useRoomsQuery } from '../queries/room/useRoomsQuery';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type {
  HotelPreviewScreenProps,
  HotelScreenProps,
} from '../app/navigation';

/**
 * The hotel is one honeycomb, not a stack of pages.
 *
 * Every finished floor is a hexagon in a pyramid — the first room at the apex,
 * each row below it one room wider — and every floor still to come is a dotted
 * outline of one, so the whole year is on screen from the first day.
 *
 * It opens close on the newest floor, filling the screen. This is the one room
 * screen that does not use `RoomScreenLayout`: that layout exists to hold a
 * title and a still room at the same height on every screen, and the hotel has
 * neither. A blank header here would only push the canvas down the screen.
 */
interface HotelContentProps {
  fromLab: boolean;
}

function HotelContent({ fromLab }: HotelContentProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const roomsQuery = useRoomsQuery(userId);
  const rooms = roomsQuery.data;
  const override = useHotelOverride();

  const realRooms = useMemo<PyramidRoom[]>(
    () =>
      (rooms ?? []).map((room) => ({
        key: room.id,
        floor: room.floor,
        shell: roomShellPolys(room.shell),
        picks: toPicks(room.decorations),
        frameHue: toFrameHue(room.frameHue),
      })),
    [rooms],
  );

  const pyramidRooms = override ?? realRooms;
  const waiting = roomsQuery.isPending && override == null;

  return (
    <>
      {fromLab ? (
        <AppTopBar showBack showAvatar={false} showStreak={false} />
      ) : (
        <View style={{ height: insets.top }} />
      )}

      {waiting ? null : pyramidRooms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No floors yet</Text>
          <Text style={styles.emptyBody}>
            Finish today's dailies to earn your first piece. Seven of them fill
            a room, and a filled room takes its place at the top of the pyramid.
          </Text>
        </View>
      ) : (
        <PyramidCanvas rooms={pyramidRooms} />
      )}
    </>
  );
}

export default function HotelScreen(_: HotelScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={{ bottom: true }}>
      <HotelContent fromLab={false} />
    </SafeAreaView>
  );
}

export function HotelPreviewScreen(_: HotelPreviewScreenProps) {
  const fromLab = useOpenedFromLab();
  return (
    <View style={styles.screen}>
      <HotelContent fromLab={fromLab} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  empty: {
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
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
