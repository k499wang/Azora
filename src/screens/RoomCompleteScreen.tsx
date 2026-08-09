import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import RoomReplay from '../features/room/RoomReplay';
import { getRoomWidth } from '../features/room/roomLayout';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../stores/authStore';
import { triggerTapHaptic } from '../native/tapHaptics';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import type { RoomCompleteScreenProps } from '../app/navigation';


export default function RoomCompleteScreen({
  navigation,
}: RoomCompleteScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;

  const room = currentRoom?.room;

  const [replayDone, setReplayDone] = useState(false);
  const reveal = useSharedValue(0);

  useEffect(() => {
    if (!replayDone) return;
    reveal.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [replayDone, reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 14 }],
  }));

  const roomWidth = getRoomWidth(width);

  const continueToHotel = () => {
    triggerTapHaptic();
    navigation.navigate('Hotel', { fromCompletion: true });
  };

  return (
    <View style={styles.screen}>
      <AppTopBar showAvatar={false} showStreak={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, revealStyle]}>
          <Text style={styles.title}>You filled every corner</Text>
        </Animated.View>

        <View style={styles.stage}>
          <RoomReplay
            width={roomWidth}
            picks={toPicks(room?.decorations ?? [])}
            frameHue={toFrameHue(room?.frameHue)}
            shell={roomShellPolys(room?.shell)}
            onDone={() => setReplayDone(true)}
          />
        </View>

        <Animated.View style={[styles.section, revealStyle]}>
          <Pressable style={styles.primaryButton} onPress={continueToHotel}>
            <Text style={styles.primaryButtonLabel}>Continue</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingBottom: spacing['7xl'],
    gap: margin.sectionGap,
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.xs,
  },
  primaryButton: {
    ...card.shadow,
    marginHorizontal: padding.screen.horizontal,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary.blue600,
  },
  primaryButtonLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
});
