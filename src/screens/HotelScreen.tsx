import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-screens/experimental';
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
import type {
  HotelPreviewScreenProps,
  HotelScreenProps,
} from '../app/navigation';

/**
 * The hotel is one honeycomb, not a stack of pages.
 *
 * Every floor is a hexagon in a pyramid — the first room at the apex, each row
 * below it one room wider — including the one being decorated right now, which
 * stands part-furnished inside the dotted outline rather than waiting until it
 * is full. An empty hotel is that outline on its own, not a message about not
 * having one.
 *
 * It opens on the whole pyramid at once. This is the one room screen that does
 * not use `RoomScreenLayout`: that layout exists to hold a title and a still
 * room at the same height on every screen, and the hotel has neither. A blank
 * header here would only push the canvas down the screen.
 */
/**
 * Floor 1, before the first object lands in it.
 *
 * The room row is only written when that object is placed, so until then there
 * is nothing to read — but the room itself is already decided: `rooms.shell`
 * and `rooms.frame_hue` default to cream and sky in the database, which is
 * exactly what these fallbacks resolve to. Drawing it means a new user opens
 * the hotel on the empty room they are about to fill rather than on a bare
 * outline of one.
 */
const FIRST_ROOM: PyramidRoom[] = [
  {
    key: 'floor-1',
    floor: 1,
    shell: roomShellPolys(undefined),
    picks: {},
    frameHue: toFrameHue(undefined),
  },
];

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

  const resolved = override ?? realRooms;
  // The hotel always has a floor 1 — except when the read failed, where an
  // empty room would claim the user has none rather than that we do not know.
  const pyramidRooms =
    resolved.length === 0 && !roomsQuery.isError ? FIRST_ROOM : resolved;
  const waiting = roomsQuery.isPending && override == null;

  return (
    <>
      {fromLab ? (
        <AppTopBar showBack showAvatar={false} showStreak={false} />
      ) : (
        <View style={{ height: insets.top }} />
      )}

      {waiting ? null : <PyramidCanvas rooms={pyramidRooms} />}
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
});
