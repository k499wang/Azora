import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import { HexRoom, type FrameHue } from '../features/room/RoomScene';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { useCreateNextRoomMutation } from '../queries/room/useCreateNextRoomMutation';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { useAuthStore } from '../stores/authStore';
import { triggerTapHaptic } from '../native/tapHaptics';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import type { RoomCompleteScreenProps } from '../app/navigation';

const MAX_ROOM_WIDTH = 320;
const SWATCH_WIDTH = 84;

const FRAME_HUES: { id: FrameHue; name: string }[] = [
  { id: 'sky', name: 'Sky' },
  { id: 'teal', name: 'Teal' },
  { id: 'blush', name: 'Blush' },
];

export default function RoomCompleteScreen({
  navigation,
}: RoomCompleteScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;
  const createNextRoom = useCreateNextRoomMutation(userId);
  const [frameHue, setFrameHue] = useState<FrameHue>('teal');

  const room = currentRoom?.room;
  const roomWidth = Math.min(
    width - padding.screen.horizontal * 2,
    MAX_ROOM_WIDTH,
  );

  const openNextRoom = () => {
    if (createNextRoom.isPending) return;

    triggerTapHaptic();
    createNextRoom.mutate(
      { frameHue },
      {
        // Back to Home rather than the picker: the next room is empty and today
        // is already claimed, so there would be nothing to do there.
        onSuccess: () => navigation.navigate('MainTabs', { screen: 'Home' }),
      },
    );
  };

  return (
    <View style={styles.screen}>
      <AppTopBar showAvatar={false} showStreak={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            Room {room?.floor ?? 1} complete
          </Text>
          <Text style={styles.title}>You filled every corner</Text>
        </View>

        <View style={styles.stage}>
          <HexRoom
            width={roomWidth}
            picks={toPicks(room?.decorations ?? [])}
            frameHue={toFrameHue(room?.frameHue)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick your next room</Text>
          <Text style={styles.sectionNote}>
            Seven more pieces to fill it.
          </Text>
          <View style={styles.swatchRow}>
            {FRAME_HUES.map((hue) => {
              const selected = hue.id === frameHue;

              return (
                <Pressable
                  key={hue.id}
                  style={[styles.swatch, selected && styles.swatchSelected]}
                  onPress={() => {
                    triggerTapHaptic();
                    setFrameHue(hue.id);
                  }}
                >
                  <HexRoom width={SWATCH_WIDTH} frameHue={hue.id} />
                  <Text
                    style={[
                      styles.swatchLabel,
                      selected && styles.swatchLabelSelected,
                    ]}
                  >
                    {hue.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          disabled={createNextRoom.isPending}
          onPress={openNextRoom}
        >
          <Text style={styles.primaryButtonLabel}>
            {createNextRoom.isPending
              ? 'Opening…'
              : `Open room ${(room?.floor ?? 1) + 1}`}
          </Text>
        </Pressable>
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
    alignItems: 'center',
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.primary.blue600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.title.title1,
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
  sectionTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  sectionNote: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  swatch: {
    ...card.base,
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.primary.blue600,
  },
  swatchLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  swatchLabelSelected: {
    color: colors.primary.blue700,
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
