import { useState } from 'react';
import RoomScreenLayout, {
  RoomActionButton,
  RoomStage,
} from '../features/room/RoomScreenLayout';
import RoomReplay from '../features/room/RoomReplay';
import { HexRoom } from '../features/room/RoomScene';

import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../stores/authStore';
import type { RoomCompleteScreenProps } from '../app/navigation';
import { useRoomWidth } from '../features/room/roomStageBox';

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
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;

  const room = currentRoom?.room;
  const roomWidth = useRoomWidth();

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
        <RoomActionButton
          label="Pick a new room"
          disabled={!replayDone}
          onPress={continueToPicker}
        />
      }
    >
      <RoomStage>
        {room != null ? (
          <RoomReplay
            width={roomWidth}
            picks={toPicks(room.decorations)}
            frameHue={toFrameHue(room.frameHue)}
            shell={roomShellPolys(room.shell)}
            onDone={() => setReplayDone(true)}
          />
        ) : (
          <HexRoom
            width={roomWidth}
            picks={{}}
            frameHue={toFrameHue(undefined)}
            shell={roomShellPolys(undefined)}
          />
        )}
      </RoomStage>
    </RoomScreenLayout>
  );
}
