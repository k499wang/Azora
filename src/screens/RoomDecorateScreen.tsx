import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import RoomScreenLayout, {
  RoomActionButton,
  RoomStage,
} from '../features/room/RoomScreenLayout';
import { HexRoom, type Picks } from '../features/room/RoomScene';
import PlacementReveal from '../features/room/PlacementReveal';
import RoomReplay from '../features/room/RoomReplay';
import NextDayCountdown from '../features/room/NextDayCountdown';
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
import { resolveUserIsPro } from '../queries/subscriptions/useUserEntitlementQuery';
import { trackRoomPickerOpened } from '../services/analytics/room';
import { useAuthStore } from '../stores/authStore';
import { triggerTapHaptic } from '../native/tapHaptics';
import { margin } from '../theme/spacing';
import type { RoomDecorateScreenProps } from '../app/navigation';
import { returnToHome } from '../app/navigation/returnToHome';

interface Placing {
  slot: RoomSlot;
  optionId: string;
  /** stable room snapshot for the animation that owns the stage */
  picks: Picks;
  /** production's seventh piece replays the finished room after its write */
  completesRoom: boolean;
}

export default function RoomDecorateScreen({
  navigation,
  route,
}: RoomDecorateScreenProps) {
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
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
  const [placementRevealDone, setPlacementRevealDone] = useState(false);
  const [roomReplayDone, setRoomReplayDone] = useState(false);
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

    const completesRoom =
      !previewing && progress.placedCount === ROOM_SLOT_COUNT - 1;

    triggerTapHaptic();
    setPicking(false);
    setPlacementRevealDone(false);
    setRoomReplayDone(false);
    setPlacing({
      slot: nextSlot,
      optionId,
      picks: completesRoom
        ? { ...placedPicks, [nextSlot]: optionId }
        : placedPicks,
      completesRoom,
    });

    if (previewing) return;

    placeDecoration.mutate({
      slot: nextSlot,
      optionId,
      earnedLocalDate: dailies.todayLocalDate,
    });
  };

  // The seventh piece skips the single-piece reveal, while normal placements
  // wait for that animation before committing their local snapshot.
  const placementAnimationDone =
    placing?.completesRoom === true || placementRevealDone;
  const writeSettled = previewing || !placeDecoration.isPending;
  const writeFailed = !previewing && placeDecoration.isError;

  useEffect(() => {
    if (placing == null || !placementAnimationDone || !writeSettled) return;

    // Placement has already taken over the screen, so a failed write can never
    // just drop them back on the picker with nothing said.
    if (writeFailed) {
      setPlacing(null);
      setPlacementRevealDone(false);
      Alert.alert('Could not place that piece', 'Please try again.');
      return;
    }

    if (placing.completesRoom) {
      return;
    }

    setLocalPicks((current) => ({
      ...current,
      [placing.slot]: placing.optionId,
    }));
    setPlacing(null);
    setPlacementRevealDone(false);

    // The room now has the piece in it. Hold there rather than dropping back to
    // a panel — the point of the last two seconds was to look at it.
    setJustPlaced(true);
  }, [
    placing,
    placementAnimationDone,
    previewing,
    writeFailed,
    writeSettled,
  ]);

  // Placing is its own moment: the room says nothing over the piece, it just
  // shows it landing and then offers the way out. Reading the panel state here
  // would put a title back mid-fall — the write settles mid-animation and flips
  // `claimedToday` — so the title stays off for the whole beat.
  const celebrating = placing != null || justPlaced;
  const completingRoom = placing?.completesRoom === true;
  const completedRoomReady = completingRoom && placeDecoration.isSuccess;
  // The room and the dailies land separately, so a half-loaded screen can read
  // as claimable for a frame. Nothing offers a piece until both are in.
  const choosing = panelState.kind === 'choose' && !celebrating && !isLoading;

  return (
    <RoomScreenLayout
      scroll
      title={
        completingRoom
          ? 'You filled every corner'
          : celebrating
            ? undefined
            : decorateTitle(panelState)
      }
      note={
        completingRoom
          ? 'All 7 decorations placed — this room is finished.'
          : celebrating || isLoading
            ? undefined
            : decorateNote(panelState)
      }
      reveal={
        completingRoom
          ? roomReplayDone
          : celebrating
            ? justPlaced
            : undefined
      }
      actionNote={
        celebrating && !completingRoom ? <NextDayCountdown /> : undefined
      }
      action={
        completingRoom ? (
          <RoomActionButton
            label="Pick a new room"
            disabled={!roomReplayDone}
            onPress={() => navigation.replace('NextRoom', route.params)}
          />
        ) : celebrating ? (
          <RoomActionButton
            label="Continue"
            onPress={() => returnToHome(navigation)}
          />
        ) : null
      }
    >
      <RoomStage>
        <View style={{ width: roomWidth }}>
          {completedRoomReady && placing != null ? (
            <RoomReplay
              width={roomWidth}
              picks={placing.picks}
              frameHue={toFrameHue(room?.frameHue)}
              shell={shell}
              onDone={() => setRoomReplayDone(true)}
            />
          ) : completingRoom ? (
            <HexRoom
              width={roomWidth}
              picks={{}}
              frameHue={toFrameHue(room?.frameHue)}
              shell={shell}
            />
          ) : placing != null && !placing.completesRoom ? (
            <PlacementReveal
              width={roomWidth}
              day={placing.slot}
              option={placing.optionId}
              picks={placing.picks}
              frameHue={toFrameHue(room?.frameHue)}
              shell={shell}
              onDone={() => setPlacementRevealDone(true)}
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
                // Opening the picker is the step between being handed a piece
                // and choosing one, and it is the only one the user can abandon
                // silently.
                if (!previewing && room != null && userId != null) {
                  const analyticsUserId = userId;
                  const properties = {
                    floor: room.floor,
                    slot: nextSlot,
                    placedCount: progress.placedCount,
                  };
                  void resolveUserIsPro(queryClient, analyticsUserId).then(
                    (isPro) => {
                      if (
                        useAuthStore.getState().user?.id !== analyticsUserId
                      ) {
                        return;
                      }
                      trackRoomPickerOpened({ isPro, ...properties });
                    },
                  );
                }
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
