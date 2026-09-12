import { StyleSheet, View } from 'react-native';
import AppTopBar from '../components/common/AppTopBar';
import RoomSealFlow from '../features/room/RoomSealFlow';
import { useRoomOverride } from '../features/room/devRoomOverride';
import { useOpenedFromLab } from '../features/room/useOpenedFromLab';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../stores/authStore';
import { returnToHome } from '../app/navigation/returnToHome';
import type { RoomCompleteScreenProps } from '../app/navigation';

/**
 * The seal, as a screen.
 *
 * The reward flow plays it on its own surface and never navigates — see
 * `RoomSealFlow`. This route exists for the two callers that arrive without a
 * surface to play it on: the lab, and the decorate screen's older path. Same
 * component, so there is only ever one version of the ending.
 */
export default function RoomCompleteScreen({
  navigation,
}: RoomCompleteScreenProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;
  // The lab previews this against a fabricated full room; null in release.
  const override = useRoomOverride();
  const fromLab = useOpenedFromLab();

  return (
    <View style={styles.screen}>
      <RoomSealFlow
        userId={userId}
        room={override?.room ?? currentRoom?.room ?? null}
        onDone={() => returnToHome(navigation)}
      />
      {/* Drawn over the seal, because the seal fills the screen. The lab jumps
          into this out of order and needs a way back out of it. */}
      {fromLab ? (
        <AppTopBar showBack showAvatar={false} showStreak={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
