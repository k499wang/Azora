import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import Icon from '../components/common/icons/Icon';
import { DecorationTile, HexRoom } from '../features/room/RoomScene';
import { getRoomDay } from '../features/room/roomDays';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { ROOM_SLOT_COUNT } from '../lib/room/roomProgress';
import { usePlaceDecorationMutation } from '../queries/room/usePlaceDecorationMutation';
import { useAuthStore } from '../stores/authStore';
import { triggerTapHaptic } from '../native/tapHaptics';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import type { RoomDecorateScreenProps } from '../app/navigation';

const MAX_ROOM_WIDTH = 300;
const TILE_COLUMNS = 2;
const CHECK_SIZE = 18;

export default function RoomDecorateScreen({
  navigation,
}: RoomDecorateScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { room, progress, dailies, isLoading } = useRoomClaim(userId);
  const placeDecoration = usePlaceDecorationMutation(userId);

  const decorations = room?.decorations ?? [];
  const shell = roomShellPolys(room?.shell);
  const contentWidth = width - padding.screen.horizontal * 2;
  const roomWidth = Math.min(contentWidth, MAX_ROOM_WIDTH);
  const tileWidth =
    (contentWidth - spacing.sm * (TILE_COLUMNS - 1)) / TILE_COLUMNS;
  const nextSlot = progress.nextSlot;
  const day = nextSlot == null ? null : getRoomDay(nextSlot);

  const pick = (optionId: string) => {
    if (nextSlot == null || !progress.canClaim) return;
    if (placeDecoration.isPending) return;

    triggerTapHaptic();
    placeDecoration.mutate(
      {
        slot: nextSlot,
        optionId,
        earnedLocalDate: dailies.todayLocalDate,
      },
      {
        onSuccess: (result) => {
          // The seventh piece finishes the room, and finishing is the biggest
          // moment in the loop — it gets its own screen rather than a state
          // swap under the user's thumb.
          if ((result.room?.decorations.length ?? 0) >= ROOM_SLOT_COUNT) {
            navigation.replace('RoomComplete');
          }
        },
      },
    );
  };

  return (
    <View style={styles.screen}>
      <AppTopBar title="Your room" showAvatar={false} showStreak={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stage}>
          <HexRoom
            width={roomWidth}
            picks={toPicks(decorations)}
            frameHue={toFrameHue(room?.frameHue)}
            shell={shell}
          />
          <Text style={styles.progress}>
            {progress.placedCount} of {ROOM_SLOT_COUNT} pieces
          </Text>
        </View>

        {isLoading ? null : progress.isComplete ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>This room is finished</Text>
            <Text style={styles.panelBody}>
              Every piece is placed. Open your next room to keep going.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                triggerTapHaptic();
                navigation.navigate('RoomComplete');
              }}
            >
              <Text style={styles.primaryButtonLabel}>See your room</Text>
            </Pressable>
          </View>
        ) : progress.claimedToday ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Today's piece is placed</Text>
            <Text style={styles.panelBody}>
              Come back tomorrow for the next one.
            </Text>
          </View>
        ) : !dailies.allCompleted ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Finish today's dailies</Text>
            <Text style={styles.panelBody}>
              All three earn you a piece for this room.
            </Text>
            <View style={styles.checklist}>
              <ChecklistRow
                label="Guided breathing"
                done={dailies.guidedCompleted}
              />
              <ChecklistRow
                label="Hand-picked exercise"
                done={dailies.handPickedCompleted}
              />
              <ChecklistRow
                label="Daily breath hold"
                done={dailies.breathHoldCompleted}
              />
            </View>
          </View>
        ) : nextSlot == null || day == null ? null : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{day.title}</Text>
            <Text style={styles.sectionNote}>Pick one — {day.note}</Text>
            <View style={styles.tileGrid}>
              {day.options.map((option) => (
                <Pressable
                  key={option.id}
                  style={[styles.tile, { width: tileWidth }]}
                  disabled={placeDecoration.isPending}
                  onPress={() => pick(option.id)}
                >
                  <DecorationTile
                    day={nextSlot}
                    option={option.id}
                    width={tileWidth - spacing.md}
                    shell={shell}
                  />
                  <Text style={styles.tileLabel}>{option.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.checklistRow}>
      <View style={[styles.checkDot, done && styles.checkDotDone]}>
        {done ? (
          <Icon name="check" size={CHECK_SIZE} color={colors.text.inverse} />
        ) : null}
      </View>
      <Text style={[styles.checklistLabel, done && styles.checklistLabelDone]}>
        {label}
      </Text>
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
  stage: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  progress: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  panel: {
    ...card.base,
    ...card.shadow,
    marginHorizontal: padding.screen.horizontal,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  panelTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  panelBody: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  checklist: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderColor: colors.primary.blue200,
  },
  checkDotDone: {
    backgroundColor: colors.primary.blue700,
    borderColor: colors.primary.blue700,
  },
  checklistLabel: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  checklistLabelDone: {
    color: colors.text.primary,
    fontFamily: fonts.semibold,
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
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tile: {
    ...card.base,
    ...card.shadow,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tileLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: spacing.sm,
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
