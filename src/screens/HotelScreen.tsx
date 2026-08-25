import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-screens/experimental';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import PyramidCanvas from '../features/room/PyramidCanvas';
import type { PyramidRoom } from '../features/room/PyramidCanvas';
import { useHotelOverride } from '../features/room/devHotelOverride';
import { getDevHotelScreenshotData } from '../features/home/devHomeScreenshotData';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { useRoomsQuery } from '../queries/room/useRoomsQuery';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
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
 *
 * Reached from the room on Home rather than a tab, and pushed over the tab bar
 * rather than under it — a bar across the bottom would sit on the rows of the
 * pyramid nearest the viewer. The way back is a floating button instead of a
 * header, for the same reason: nothing here may cost the canvas height.
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

const BACK_ICON_SIZE = 20;

interface HotelContentProps {
  onBack: () => void;
  screenshotRooms?: PyramidRoom[] | null;
}

function HotelContent({ onBack, screenshotRooms }: HotelContentProps) {
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

  const resolved = override ?? screenshotRooms ?? realRooms;
  // The hotel always has a floor 1 — except when the read failed, where an
  // empty room would claim the user has none rather than that we do not know.
  const pyramidRooms =
    resolved.length === 0 && !roomsQuery.isError ? FIRST_ROOM : resolved;
  const waiting =
    roomsQuery.isPending && override == null && screenshotRooms == null;

  return (
    <>
      <View style={{ height: insets.top }} />

      {waiting ? null : <PyramidCanvas rooms={pyramidRooms} />}

      {/* Level with the canvas's own zoom controls, which start at the same
          inset on the other side. */}
      <View style={[styles.back, { top: insets.top + spacing.sm }]}>
        <GlassIconButton accessibilityLabel="Back" onPress={onBack}>
          <Icon
            name="chevron-left"
            size={BACK_ICON_SIZE}
            color={colors.text.primary}
          />
        </GlassIconButton>
      </View>
    </>
  );
}

export default function HotelScreen({ navigation }: HotelScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={{ bottom: true }}>
      <HotelContent
        onBack={() => navigation.goBack()}
        screenshotRooms={getDevHotelScreenshotData()}
      />
    </SafeAreaView>
  );
}

export function HotelPreviewScreen({ navigation }: HotelPreviewScreenProps) {
  return (
    <View style={styles.screen}>
      <HotelContent onBack={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  back: {
    position: 'absolute',
    left: spacing.md,
  },
});
