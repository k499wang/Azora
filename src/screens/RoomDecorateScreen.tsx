import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../components/common/Text';
import { Rise } from '../components/common/Reveal';
import RoomScreenLayout, {
  RoomActionButton,
  RoomStage,
} from '../features/room/RoomScreenLayout';
import { HexRoom, type Picks } from '../features/room/RoomScene';
import PlacementReveal from '../features/room/PlacementReveal';
import DecoratePanel, {
  type DecorateState,
} from '../features/room/DecoratePanel';
import { getRoomDay } from '../features/room/roomDays';
import { toFrameHue, toPicks } from '../features/room/roomPicks';
import { roomShellPolys } from '../features/room/roomShells';
import { getRoomWidth } from '../features/room/roomLayout';
import { useRoomClaim } from '../features/room/useRoomClaim';
import { isRoomOverridden } from '../features/room/devRoomOverride';
import { useStartDaily } from '../hooks/useStartDaily';
import { ROOM_SLOT_COUNT, type RoomSlot } from '../lib/room/roomProgress';
import { usePlaceDecorationMutation } from '../queries/room/usePlaceDecorationMutation';
import { useAuthStore } from '../stores/authStore';
import { triggerTapHaptic } from '../native/tapHaptics';
import { colors } from '../theme/colors';
import { stagger } from '../theme/motion';
import { margin, padding } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RoomDecorateScreenProps } from '../app/navigation';


interface Placing {
  slot: RoomSlot;
  optionId: string;
  /** the room as it looked before this piece — the reveal drops the piece onto it */
  picks: Picks;
}

export default function RoomDecorateScreen({
  navigation,
}: RoomDecorateScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { room, progress, dailies, isLoading } = useRoomClaim(userId);
  const placeDecoration = usePlaceDecorationMutation(userId);
  const { start } = useStartDaily('RoomDecorate');

  const decorations = room?.decorations ?? [];
  const shell = roomShellPolys(room?.shell);
  const roomWidth = getRoomWidth(width);
  const nextSlot = progress.nextSlot;
  const day = nextSlot == null ? null : getRoomDay(nextSlot);
  const panelState: DecorateState = progress.isComplete
    ? { kind: 'complete' }
    : progress.claimedToday
      ? { kind: 'claimed' }
      : !dailies.allCompleted
        ? {
            kind: 'locked',
            guidedDone: dailies.guidedCompleted,
            handPickedDone: dailies.handPickedCompleted,
            breathHoldDone: dailies.breathHoldCompleted,
          }
        : { kind: 'choose', slot: nextSlot ?? 'day1' };

  const [placing, setPlacing] = useState<Placing | null>(null);
  const [revealDone, setRevealDone] = useState(false);
  const [justPlaced, setJustPlaced] = useState(false);
  // What was placed this visit, held locally. The query is the source of truth,
  // but it refreshes a beat after the reveal ends — and under a faked room it
  // never refreshes at all — so without this the piece pops in and vanishes.
  const [localPicks, setLocalPicks] = useState<Picks>({});
  const [selected, setSelected] = useState<string | null>(null);

  const placedPicks: Picks = { ...toPicks(decorations), ...localPicks };
  // The highlighted option is drawn straight into the room, so choosing is
  // seeing it where it will live rather than guessing from a thumbnail.
  const shownPicks: Picks =
    selected != null && nextSlot != null
      ? { ...placedPicks, [nextSlot]: selected }
      : placedPicks;

  // The dev lab hands this screen a fabricated room. Playing the reveal is the
  // point there; writing a decoration against invented state is not.
  const previewing = isRoomOverridden();

  const pick = (optionId: string) => {
    if (nextSlot == null || !progress.canClaim || day == null) return;
    if (placing != null || placeDecoration.isPending) return;

    triggerTapHaptic();
    setPlacing({
      slot: nextSlot,
      optionId,
      picks: placedPicks,
    });
    setSelected(null);

    if (previewing) return;

    placeDecoration.mutate({
      slot: nextSlot,
      optionId,
      earnedLocalDate: dailies.todayLocalDate,
    });
  };

  // The reveal and the write race each other; whichever finishes last decides
  // when the screen moves on, so the animation is never cut short and the room
  // never renders a frame without the piece that just landed in it.
  const placed = placeDecoration.data?.room?.decorations.length ?? 0;
  const writeSettled = previewing || !placeDecoration.isPending;
  const writeFailed = !previewing && placeDecoration.isError;

  useEffect(() => {
    if (placing == null || !revealDone || !writeSettled) return;

    if (!writeFailed) {
      setLocalPicks((current) => ({
        ...current,
        [placing.slot]: placing.optionId,
      }));
    }

    setPlacing(null);
    setRevealDone(false);

    // The reveal has already told them the piece landed, so a failed write can
    // never just drop them back on the picker with nothing said.
    if (writeFailed) {
      Alert.alert('Could not place that piece', 'Please try again.');
      return;
    }

    // The seventh piece finishes the room, and finishing is the biggest moment
    // in the loop — it gets its own screen rather than a state swap under the
    // user's thumb.
    if (!previewing && placed >= ROOM_SLOT_COUNT) {
      navigation.replace('RoomComplete');
      return;
    }

    // The room now has the piece in it. Hold there rather than dropping back to
    // a panel — the point of the last two seconds was to look at it.
    setJustPlaced(true);
  }, [
    navigation,
    placed,
    placing,
    previewing,
    revealDone,
    writeFailed,
    writeSettled,
  ]);

  return (
    <RoomScreenLayout
      scroll
      action={
        justPlaced ? (
          <Rise delay={stagger.loose * 3}>
            <RoomActionButton
              label="Continue"
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'Home' })
              }
            />
          </Rise>
        ) : null
      }
    >
      <RoomStage
        banner={
          justPlaced ? (
            <Rise style={styles.congratsWrap}>
              <Text style={styles.congrats}>Congratulations!</Text>
            </Rise>
          ) : null
        }
        caption={
          placing == null
            ? `${Object.keys(placedPicks).length} of ${ROOM_SLOT_COUNT} pieces`
            : undefined
        }
      >
        {placing != null ? (
          <PlacementReveal
            width={roomWidth}
            day={placing.slot}
            option={placing.optionId}
            picks={placing.picks}
            frameHue={toFrameHue(room?.frameHue)}
            shell={shell}
            onDone={() => setRevealDone(true)}
          />
        ) : (
          <HexRoom
            width={roomWidth}
            picks={shownPicks}
            frameHue={toFrameHue(room?.frameHue)}
            shell={shell}
          />
        )}
      </RoomStage>

      {justPlaced || placing != null || isLoading ? null : (
        <View style={styles.panelWrap}>
          <DecoratePanel
            state={panelState}
            busy={placeDecoration.isPending}
            selected={selected}
            onSelect={setSelected}
            onSeeRoom={() => {
              triggerTapHaptic();
              navigation.navigate('RoomComplete');
            }}
            onStartDaily={(daily) => {
              triggerTapHaptic();
              start(daily);
            }}
            onPick={pick}
          />
        </View>
      )}
    </RoomScreenLayout>
  );
}

const styles = StyleSheet.create({
  congratsWrap: {
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'center',
  },
  congrats: {
    ...typography.display.display3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  panelWrap: {
    marginTop: margin.sectionGap,
  },
});
