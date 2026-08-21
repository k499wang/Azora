import { useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import HotelChip from './HotelChip';
import RoomBlob, { type RoomBlobHandle } from './RoomBlob';
import { HexRoom, ROOM_ASPECT } from './RoomScene';
import { toFrameHue, toPicks } from './roomPicks';
import { roomShellPolys } from './roomShells';
import { getRoomWidth } from './roomLayout';
import { padding, spacing } from '../../theme/spacing';
import { triggerBounceHaptic } from '../../native/tapHaptics';
import type { RoomProgress } from '../../lib/room/roomProgress';
import type { Room } from '../../services/room/roomService';

interface HomeRoomProps {
  room: Room | null;
  progress: Pick<RoomProgress, 'canClaim' | 'placedCount'>;
}

export default function HomeRoom({ room, progress }: HomeRoomProps) {
  const { width } = useWindowDimensions();
  const blob = useRef<RoomBlobHandle>(null);
  const roomWidth = getRoomWidth(width);

  return (
    <View style={styles.stage}>
      {/* Above the room rather than over it. The chip is a control and the room
          is artwork; overlapping them made the chip read as part of the
          picture, and left it competing with the hexagon's own edge. */}
      <View style={styles.chipRow}>
        <HotelChip floors={room?.floor ?? 1} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          progress.canClaim
            ? 'Your room. A new piece is ready to place.'
            : `Your room, ${progress.placedCount} of 7 pieces.`
        }
        accessibilityHint="Says hello to the blob living in your room"
        onPress={() => {
          triggerBounceHaptic();
          blob.current?.cheer();
        }}
      >
        <View style={{ width: roomWidth, height: roomWidth * ROOM_ASPECT }}>
          <HexRoom
            width={roomWidth}
            picks={toPicks(room?.decorations ?? [])}
            frameHue={toFrameHue(room?.frameHue)}
            shell={roomShellPolys(room?.shell)}
          />
          <RoomBlob ref={blob} width={roomWidth} />
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
  chipRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing.sm,
  },
});
