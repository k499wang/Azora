import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import RoomScreenLayout, {
  RoomActionButton,
  RoomStage,
} from '../features/room/RoomScreenLayout';
import RoomReplay from '../features/room/RoomReplay';
import { getRoomWidth } from '../features/room/roomLayout';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../stores/authStore';
import type { RoomCompleteScreenProps } from '../app/navigation';

/**
 * The finished room, replaying itself.
 *
 * One job: the payoff for seven days. Choosing the next room is its own screen
 * so this one is not also a form.
 */
export default function RoomCompleteScreen({
  navigation,
  route,
}: RoomCompleteScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;

  const room = currentRoom?.room;
  const roomWidth = getRoomWidth(width);

  const [replayDone, setReplayDone] = useState(false);

  const continueToPicker = () => {
    navigation.replace('NextRoom', route.params);
  };

  return (
    <RoomScreenLayout
      scroll
      title="You filled every corner"
      note="All 7 decorations placed — this room is finished."
      // Both held until the replay lands, both holding their space until then.
      reveal={replayDone}
      action={
        <RoomActionButton label="Pick a new room" onPress={continueToPicker} />
      }
    >
      <RoomStage>
        <RoomReplay
          width={roomWidth}
          picks={toPicks(room?.decorations ?? [])}
          frameHue={toFrameHue(room?.frameHue)}
          shell={roomShellPolys(room?.shell)}
          onDone={() => setReplayDone(true)}
        />
      </RoomStage>
    </RoomScreenLayout>
  );
}
