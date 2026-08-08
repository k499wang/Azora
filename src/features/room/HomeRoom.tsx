import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import { HexRoom } from './RoomScene';
import { toFrameHue, toPicks } from './roomPicks';
import { roomShellPolys } from './roomShells';
import { useRoomClaim } from './useRoomClaim';
import { useAuthStore } from '../../stores/authStore';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { MainTabNavigationProp } from '../../app/navigation';

const MAX_ROOM_WIDTH = 320;

export default function HomeRoom() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { room, progress } = useRoomClaim(userId);
  const roomWidth = Math.min(
    width - padding.screen.horizontal * 2,
    MAX_ROOM_WIDTH,
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        progress.canClaim
          ? 'Your room. A new piece is ready to place.'
          : `Your room, ${progress.placedCount} of 7 pieces.`
      }
      accessibilityHint="Opens your room"
      style={styles.stage}
      onPress={() => {
        triggerTapHaptic();
        navigation.navigate(progress.isComplete ? 'RoomComplete' : 'RoomDecorate');
      }}
    >
      <HexRoom
        width={roomWidth}
        picks={toPicks(room?.decorations ?? [])}
        frameHue={toFrameHue(room?.frameHue)}
        shell={roomShellPolys(room?.shell)}
      />
      {progress.canClaim ? (
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeLabel}>A new piece is ready</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  badge: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    marginTop: -spacing.sm,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.blue600,
  },
  badgeLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
