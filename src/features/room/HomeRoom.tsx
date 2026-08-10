import { useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import RoomBlob, { type RoomBlobHandle } from './RoomBlob';
import { HexRoom, ROOM_ASPECT } from './RoomScene';
import { toFrameHue, toPicks } from './roomPicks';
import { roomShellPolys } from './roomShells';
import { getRoomWidth } from './roomLayout';
import { useRoomClaim } from './useRoomClaim';
import { useAuthStore } from '../../stores/authStore';
import { triggerBounceHaptic } from '../../native/tapHaptics';

export default function HomeRoom() {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { room, progress } = useRoomClaim(userId);
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
