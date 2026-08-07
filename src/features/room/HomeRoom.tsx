import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HexRoom } from './RoomScene';
import { toFrameHue, toPicks } from './roomPicks';
import { useCurrentRoomQuery } from '../../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../../stores/authStore';
import { padding } from '../../theme/spacing';
import type { MainTabNavigationProp } from '../../app/navigation';

const MAX_ROOM_WIDTH = 320;

export default function HomeRoom() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const room = useCurrentRoomQuery(userId).data;
  const roomWidth = Math.min(
    width - padding.screen.horizontal * 2,
    MAX_ROOM_WIDTH,
  );

  return (
    <Pressable
      style={styles.stage}
      onPress={() => navigation.navigate('RoomDecorate')}
    >
      <HexRoom
        width={roomWidth}
        picks={toPicks(room?.decorations ?? [])}
        frameHue={toFrameHue(room?.frameHue)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
