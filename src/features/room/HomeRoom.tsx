import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import RoomBlob, { type RoomBlobHandle } from './RoomBlob';
import RoomLayer from './RoomLayer';
import { START, floorY, passedCount } from './blobWalk';
import { roomFloor, roomLayers } from './roomLayers';
import { ROOM_ASPECT } from './roomGeometry';
import { toFrameHue, toPicks } from './roomPicks';
import { roomShellPolys } from './roomShells';
import { getHomeRoomWidth } from './roomLayout';
import { triggerBounceHaptic } from '../../native/tapHaptics';
import type { RoomProgress } from '../../lib/room/roomProgress';
import type { Room } from '../../services/room/roomService';

interface HomeRoomProps {
  room: Room | null;
  progress: Pick<RoomProgress, 'canClaim' | 'placedCount'>;
}

/**
 * Home's room, drawn in layers around its resident.
 *
 * The blob walks the whole floor, so it has to be painted *into* the room
 * rather than over it: the pieces it has walked past go under it, the ones it
 * is still behind go on top. It reports which as it crosses them, and its own
 * floor plan keeps it out of their bases — so the decorations are never
 * covered, moved or drawn differently by having a blob in the room.
 */
export default function HomeRoom({ room, progress }: HomeRoomProps) {
  const { width } = useWindowDimensions();
  const blob = useRef<RoomBlobHandle>(null);
  const roomWidth = getHomeRoomWidth(width);

  const picks = useMemo(() => toPicks(room?.decorations ?? []), [room]);
  const layers = useMemo(
    () => roomLayers(picks, roomShellPolys(room?.shell), toFrameHue(room?.frameHue)),
    [picks, room?.frameHue, room?.shell],
  );
  const floor = useMemo(() => roomFloor(picks), [picks]);
  const frontEdges = useMemo(
    () => layers.pieces.map((piece) => piece.front),
    [layers],
  );

  const [passed, setPassed] = useState(() =>
    passedCount(frontEdges, floorY(START)),
  );
  const cut = Math.min(passed, layers.pieces.length);

  const behind = useMemo(
    () => layers.pieces.slice(0, cut).flatMap((piece) => piece.polys),
    [cut, layers],
  );
  const inFront = useMemo(
    () => [
      ...layers.pieces.slice(cut).flatMap((piece) => piece.polys),
      ...layers.frame,
    ],
    [cut, layers],
  );

  const onPassed = useCallback((count: number) => setPassed(count), []);

  return (
    <View style={styles.stage}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          progress.canClaim
            ? 'Your room. A new decoration is ready to place.'
            : `Your room, ${progress.placedCount} of 7 decorations placed.`
        }
        accessibilityHint="Says hello to the blob living in your room"
        onPress={() => {
          triggerBounceHaptic();
          blob.current?.cheer();
        }}
      >
        <View style={{ width: roomWidth, height: roomWidth * ROOM_ASPECT }}>
          <RoomLayer width={roomWidth} polys={layers.base} />
          <RoomLayer width={roomWidth} polys={behind} />
          <RoomBlob
            ref={blob}
            width={roomWidth}
            floor={floor}
            frontEdges={frontEdges}
            onPassed={onPassed}
          />
          <RoomLayer width={roomWidth} polys={inFront} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
