import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import RoomScreenLayout, {
  RoomActionButton,
  RoomStage,
} from '../features/room/RoomScreenLayout';
import { HexRoom, type Picks } from '../features/room/RoomScene';
import PlacementReveal from '../features/room/PlacementReveal';
import DecoratePanel, {
  decorateNote,
  decorateTitle,
  type DecorateState,
} from '../features/room/DecoratePanel';
import PickDecorationSheet from '../features/room/PickDecorationSheet';
import RoomSlotPlus from '../features/room/RoomSlotPlus';
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
import { margin } from '../theme/spacing';
import type { RoomDecorateScreenProps } from '../app/navigation';
import { returnToHome } from '../app/navigation/returnToHome';

interface Placing {
  slot: RoomSlot;
  optionId: string;
  /** the room as it looked before this piece — the reveal drops the piece onto it */
  picks: Picks;
}

export default function RoomDecorateScreen({
  navigation,
  route,
}: RoomDecorateScreenProps) {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { room, progress, dailies, isLoading } = useRoomClaim(userId);
  const placeDecoration = usePlaceDecorationMutation(userId);
  const { start } = useStartDaily('RoomDecorate', dailies);

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
  const [picking, setPicking] = useState(false);

  const placedPicks: Picks = { ...toPicks(decorations), ...localPicks };

  // The dev lab hands this screen a fabricated room. Playing the reveal is the
  // point there; writing a decoration against invented state is not.
  const previewing = isRoomOverridden();

  const pick = (optionId: string) => {
    if (nextSlot == null || !progress.canClaim || day == null) return;
    if (placing != null || placeDecoration.isPending) return;

    triggerTapHaptic();
    setPicking(false);
    setPlacing({
      slot: nextSlot,
      optionId,
      picks: placedPicks,
    });

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
      navigation.replace('RoomComplete', route.params);
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
    route.params,
    writeFailed,
    writeSettled,
  ]);

  // The piece falling and the screen congratulating you are one moment: the
  // congratulation is already the title while it falls — the write settles
  // mid-animation and flips `claimedToday`, and reading the panel state here
  // made the title say "Today's piece is placed" for a beat first — and it
  // arrives with the button once the piece has landed.
  const celebrating = placing != null || justPlaced;
  // The room and the dailies land separately, so a half-loaded screen can read
  // as claimable for a frame. Nothing offers a piece until both are in.
  const choosing = panelState.kind === 'choose' && !celebrating && !isLoading;

  return (
    <RoomScreenLayout
      scroll
      title={celebrating ? 'Congratulations!' : decorateTitle(panelState)}
      note={choosing ? decorateNote(panelState) : undefined}
      reveal={celebrating ? justPlaced : undefined}
      action={
        celebrating ? (
          <RoomActionButton
            label="Continue"
            onPress={() => returnToHome(navigation)}
          />
        ) : null
      }
    >
      <RoomStage>
        <View style={{ width: roomWidth }}>
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
              picks={placedPicks}
              frameHue={toFrameHue(room?.frameHue)}
              shell={shell}
            />
          )}

          {/* The empty slot is the button: tap the gap, choose what fills it. */}
          {choosing && nextSlot != null ? (
            <RoomSlotPlus
              roomWidth={roomWidth}
              slot={nextSlot}
              disabled={placeDecoration.isPending}
              onPress={() => {
                triggerTapHaptic();
                setPicking(true);
              }}
            />
          ) : null}
        </View>
      </RoomStage>

      {celebrating || isLoading || panelState.kind === 'choose' ? null : (
        <View style={styles.panelWrap}>
          <DecoratePanel
            state={panelState}
            onSeeRoom={() => {
              triggerTapHaptic();
              navigation.replace('RoomComplete', route.params);
            }}
            onStartDaily={(daily) => {
              triggerTapHaptic();
              start(daily);
            }}
          />
        </View>
      )}

      {choosing && nextSlot != null ? (
        <PickDecorationSheet
          visible={picking}
          slot={nextSlot}
          busy={placeDecoration.isPending}
          onCancel={() => setPicking(false)}
          onConfirm={pick}
        />
      ) : null}
    </RoomScreenLayout>
  );
}

const styles = StyleSheet.create({
  panelWrap: {
    marginTop: margin.sectionGap,
  },
});
