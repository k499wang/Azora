import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import RoomAzo, { AZO_FLOOR_Y } from './RoomAzo';
import RoomGhostSlots from './RoomGhostSlots';
import RoomLayer from './RoomLayer';
import { passedCount } from './blobWalk';
import { roomLayers } from './roomLayers';
import { ROOM_ASPECT } from './roomGeometry';
import { toFrameHue, toPicks } from './roomPicks';
import { roomShellPolys } from './roomShells';
import { getHomeRoomWidth } from './roomLayout';
import { triggerBounceHaptic } from '../../native/tapHaptics';
import type { AzoHandle } from '../mascot/AzoPortrait';
import type { RoomProgress } from '../../lib/room/roomProgress';
import type { Room } from '../../services/room/roomService';

interface HomeRoomProps {
  room: Room | null;
  progress: Pick<RoomProgress, 'canClaim' | 'placedCount' | 'nextSlot'>;
  /** dev only: replays the reward flow without arranging a real day */
  onLongPress?: () => void;
  /**
   * How the empty slot is drawn: at rest, breathing while it is being offered,
   * or gone while a piece is being previewed in it.
   */
  ghost?: 'idle' | 'pulsing' | 'hidden';
}

/**
 * Home's room, drawn in layers around its resident.
 *
 * Azo stands in one place, so the pieces he is in front of and the pieces he is
 * behind are settled by where the floor puts him rather than reported as he
 * moves: the split is a function of the decorations, not of a frame.
 */
export default function HomeRoom({
  room,
  progress,
  onLongPress,
  ghost = 'idle',
}: HomeRoomProps) {
  const { width } = useWindowDimensions();
  const azo = useRef<AzoHandle>(null);
  const roomWidth = getHomeRoomWidth(width);

  const picks = useMemo(() => toPicks(room?.decorations ?? []), [room]);
  const layers = useMemo(
    () => roomLayers(picks, roomShellPolys(room?.shell), toFrameHue(room?.frameHue)),
    [picks, room?.frameHue, room?.shell],
  );

  const cut = useMemo(
    () =>
      passedCount(
        layers.pieces.map((piece) => piece.front),
        AZO_FLOOR_Y,
      ),
    [layers],
  );

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

  return (
    <View style={styles.stage}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          progress.canClaim
            ? 'Your room. A new decoration is ready to place.'
            : `Your room, ${progress.placedCount} of 7 decorations placed.`
        }
        accessibilityHint="Says hello to Azo, who lives in your room"
        onPress={() => {
          triggerBounceHaptic();
          azo.current?.cheer();
        }}
        onLongPress={onLongPress}
      >
        <View style={{ width: roomWidth, height: roomWidth * ROOM_ASPECT }}>
          <RoomLayer width={roomWidth} polys={layers.base} />
          {ghost === 'hidden' ? null : (
            <RoomGhostSlots
              width={roomWidth}
              slot={progress.nextSlot}
              pulsing={ghost === 'pulsing'}
            />
          )}
          <RoomLayer width={roomWidth} polys={behind} />
          <RoomAzo ref={azo} width={roomWidth} />
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
