import { useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import RoomBlob, { type RoomBlobHandle } from './RoomBlob';
import { HexRoom, ROOM_ASPECT } from './RoomScene';
import { toFrameHue, toPicks } from './roomPicks';
import { roomShellPolys } from './roomShells';
import { getRoomWidth } from './roomLayout';
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        progress.canClaim
          ? 'Your room. A new piece is ready to place.'
          : `Your room, ${progress.placedCount} of 7 pieces.`
      }
      accessibilityHint="Says hello to the blob living in your room"
      style={styles.stage}
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
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
