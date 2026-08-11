import { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from '../components/common/Text';
import { Rise } from '../components/common/Reveal';
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
import { colors } from '../theme/colors';
import { stagger } from '../theme/motion';
import { margin, padding, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RoomCompleteScreenProps } from '../app/navigation';

/**
 * The finished room, replaying itself.
 *
 * One job: the payoff for seven days. Choosing the next room is its own screen
 * so this one is not also a form.
 */
export default function RoomCompleteScreen({
  navigation,
}: RoomCompleteScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;

  const room = currentRoom?.room;
  const roomWidth = getRoomWidth(width);

  const [replayDone, setReplayDone] = useState(false);

  const continueToPicker = () => {
    navigation.navigate('NextRoom');
  };

  return (
    <RoomScreenLayout scroll>
      <Rise when={replayDone} style={styles.header}>
        <Text style={styles.title}>You filled every corner</Text>
      </Rise>

      <RoomStage>
        <RoomReplay
          width={roomWidth}
          picks={toPicks(room?.decorations ?? [])}
          frameHue={toFrameHue(room?.frameHue)}
          shell={roomShellPolys(room?.shell)}
          onDone={() => setReplayDone(true)}
        />
      </RoomStage>

      <Rise when={replayDone} delay={stagger.base} style={styles.actionWrap}>
        <RoomActionButton label="Continue" onPress={continueToPicker} />
      </Rise>
    </RoomScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing['2xl'],
  },
  title: {
    ...typography.display.display3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  actionWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
});
