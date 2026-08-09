import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import RoomScreenLayout, {
  RoomActionButton,
} from '../features/room/RoomScreenLayout';
import RoomPager from '../features/room/RoomPager';
import { HexRoom } from '../features/room/RoomScene';
import {
  ROOM_SHELLS,
  ROOM_STYLES,
  toRoomShell,
  type RoomStyle,
} from '../features/room/roomShells';
import { getRoomWidth } from '../features/room/roomLayout';
import { useCreateNextRoomMutation } from '../queries/room/useCreateNextRoomMutation';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../stores/authStore';
import type { NextRoomScreenProps } from '../app/navigation';

/**
 * Picking the room to live in for the next seven days.
 *
 * Full-width pages rather than a row of swatches: the look is the whole reward,
 * and a 90pt thumbnail cannot show the difference between a plank floor and a
 * checker one.
 */
export default function NextRoomScreen({ navigation }: NextRoomScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;
  const createNextRoom = useCreateNextRoomMutation(userId);

  const room = currentRoom?.room;
  const currentShell = toRoomShell(room?.shell);
  const roomWidth = getRoomWidth(width);
  const nextFloor = (room?.floor ?? 1) + 1;

  // Open on a look they are not already living in, so the next room reads as a
  // new place rather than a repeat of the one they just finished.
  const initialIndex = Math.max(
    0,
    ROOM_STYLES.findIndex((it) => it.shell !== currentShell),
  );
  const [style, setStyle] = useState<RoomStyle>(ROOM_STYLES[initialIndex]);

  const openNextRoom = () => {
    if (createNextRoom.isPending) return;

    createNextRoom.mutate(
      { shell: style.shell, frameHue: style.frameHue },
      {
        // Home rather than the picker: the new room is empty and today is
        // already spent, so there would be nothing to do there.
        onSuccess: () => navigation.navigate('MainTabs', { screen: 'Home' }),
      },
    );
  };

  return (
    <RoomScreenLayout
      title="Pick your next room"
      note="Swipe to look around. Seven more pieces to fill it."
      action={
        <RoomActionButton
          label={createNextRoom.isPending ? 'Opening…' : `Open room ${nextFloor}`}
          disabled={createNextRoom.isPending}
          onPress={openNextRoom}
        />
      }
    >
      <RoomPager<RoomStyle>
        items={ROOM_STYLES}
        pageWidth={width}
        initialIndex={initialIndex}
        keyOf={(option) => option.shell}
        captionOf={(option) => option.name}
        onIndexChange={(index) => setStyle(ROOM_STYLES[index])}
        renderItem={(option) => (
          <HexRoom
            width={roomWidth}
            frameHue={option.frameHue}
            shell={ROOM_SHELLS[option.shell]}
          />
        )}
      />
    </RoomScreenLayout>
  );
}
