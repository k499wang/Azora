import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import ChunkyButton from '../../components/common/ChunkyButton';
import HomeRoom from './HomeRoom';
import PlacementReveal from './PlacementReveal';
import { DecorationSolo } from './roomStage';
import { getRoomDay, getRoomDayLabel } from './roomDays';
import { toFrameHue, toPicks } from './roomPicks';
import { roomShellPolys } from './roomShells';
import { ROOM_ASPECT } from './roomGeometry';
import type { Picks } from './RoomScene';
import { getHomeRoomWidth } from './roomLayout';
import { CELEBRATION_HUE } from './DailyCompleteSheet';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { LINE, card, radius } from '../../theme/card';
import { easing } from '../../theme/motion';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  ROOM_SLOT_COUNT,
  type RoomProgress,
  type RoomSlot,
} from '../../lib/room/roomProgress';
import type { Room } from '../../services/room/roomService';

/**
 * Filling the day's slot, on the same field the celebration played on.
 *
 * `DailyCompleteSheet` hands over here: it keeps the flame and the numbers, and
 * this keeps the room. They never share the screen, because they cannot — the
 * celebration is white text and the room underneath it is a different colour in
 * every shell and changes every time a piece is placed, so text over it is
 * legible in some rooms and not others. Splitting them in time is what makes
 * both readable; the night field carries across, so it still reads as one
 * moment rather than two screens.
 *
 * Leaving is the transform: the room shrinks into the exact frame Home draws it
 * at, so the last thing seen is the room that just changed, in its place.
 * Arriving cannot do the same — the sheet's field covers Home's room, and there
 * is nothing on screen for a room to grow out of.
 *
 * Picking is two beats, not one: a tile puts the piece *in the room* so it can
 * be seen where it will live, and a second press commits it. A row of
 * thumbnails cannot answer "does this go with what I have" — the room can.
 */
export const REWARD_FLOW_BEATS = {
  /**
   * The field closes over the celebration standing behind it. Both are content
   * of one presentation, so this is a cross-fade between two views — nothing is
   * dismissed, and no frame falls through to the screen underneath.
   */
  cover: 160,
  /** the room settles at full size */
  enter: 260,
  /** the slot starts asking */
  slot: 260,
  /** the rail arrives once the room has stopped moving */
  rail: 420,
  /** the piece is left at rest before the room goes back */
  hold: 420,
  /** the room returns to its place on Home */
  exit: 300,
} as const;

const TILE = 88;
const WELL = TILE - spacing.sm * 2;

export interface RewardFlowOrigin {
  /** where Home draws its room, in window coordinates */
  x: number;
  y: number;
  width: number;
}

/** the room's frame on the stage, for whatever takes the surface over next */
export interface RewardRoomBox {
  x: number;
  y: number;
  width: number;
  scale: number;
}

interface Props {
  /** the frame on Home the room returns to when this closes */
  origin: RewardFlowOrigin | null;
  room: Room | null;
  progress: Pick<RoomProgress, 'canClaim' | 'placedCount' | 'nextSlot'>;
  /** server-confirmed entitlement; the rail stays shut until this is true */
  rewardReady: boolean;
  /** commits the piece; the landing plays while the write is in flight */
  onPlace: (optionId: string) => void;
  onDismiss: () => void;
  /**
   * Where the room stood when the last piece was committed.
   *
   * The seal takes the surface from here and draws the same room, so it has to
   * know where this left it — otherwise the room jumps the moment the week
   * starts replaying, which is the one moment it should be the steadiest thing
   * on screen.
   */
  onSealFrom?: (box: RewardRoomBox) => void;
  /** drawn inside `DailyRewardSurface`, which owns the presentation */
  hosted?: boolean;
}

function DailyRewardFlow({
  origin,
  room,
  progress,
  rewardReady,
  onPlace,
  onDismiss,
  onSealFrom,
  hosted = false,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [selected, setSelected] = useState<string | null>(null);
  /**
   * The piece in the air, frozen at the moment it was committed.
   *
   * None of this may be read live while the landing plays. The write seeds the
   * room cache on success, which advances `nextSlot` and rewrites `picks` — so
   * a reveal reading those would change which decoration it was dropping
   * halfway down, into a slot that no longer exists, over a room that already
   * contains it.
   */
  const [landing, setLanding] = useState<{
    slot: RoomSlot;
    option: string;
    /** the room as it was before this piece */
    picks: Picks;
  } | null>(null);
  const [landed, setLanded] = useState(false);
  /**
   * A piece has been committed — falling, or on the way to the seal.
   *
   * From here nothing the user can touch may change the outcome: the write is
   * away, and a dismiss would cut the landing short and race the return that
   * follows it.
   */
  const [committed, setCommitted] = useState(false);
  /**
   * The entrance is over and the slot may start asking.
   *
   * The ghost breathes on a repeating animation of its own. Run during the
   * entrance it is a second thing moving on the same artwork, which is both a
   * competing read and a second reason to redraw every frame.
   */
  const [settled, setSettled] = useState(false);
  /**
   * The sheet's real height, not an estimate of it. The room takes whatever is
   * left above it — a guessed constant put the room through the sheet on a
   * small phone and left it stranded high on a large one.
   */
  const [sheetHeight, setSheetHeight] = useState(0);

  const cover = useSharedValue(0);
  const enter = useSharedValue(0);
  const leave = useSharedValue(0);
  const railOut = useSharedValue(0);

  const slot = progress.nextSlot;
  const day = slot == null ? null : getRoomDay(slot);
  const slotLabel = slot == null ? null : getRoomDayLabel(slot);
  /**
   * The room as it stands, without the piece being previewed. `PlacementReveal`
   * draws the arriving object itself, so it must be handed the room it is
   * arriving into.
   */
  const placedPicks = useMemo(
    () => toPicks(room?.decorations ?? []),
    [room],
  );
  const shell = useMemo(() => roomShellPolys(room?.shell), [room?.shell]);
  const frameHue = useMemo(() => toFrameHue(room?.frameHue), [room?.frameHue]);

  /**
   * The room with the chosen piece already in it.
   *
   * The preview used to be drawn in its own layer over the finished room, which
   * put it in front of everything — including the wall trim that should cross
   * it. Committing then moved it into its real place in the paint order, so the
   * piece changed layer on the frame it was placed. Building it into the room
   * instead means the preview *is* the result: nothing about it changes when it
   * lands except that it falls there.
   */
  const previewRoom = useMemo(() => {
    if (room == null || selected == null || slot == null) return room;

    return {
      ...room,
      decorations: [
        ...room.decorations,
        { slot, optionId: selected, earnedLocalDate: '' },
      ],
    };
  }, [room, selected, slot]);
  const unlocked = rewardReady && progress.canClaim;
  /**
   * The seventh piece does not get a landing of its own.
   *
   * A single object falling into the last free corner is the smallest beat in
   * the loop landing on its largest moment. The room is finished instead: this
   * hands straight over to the seal, which replays the whole week and ends by
   * pulling back far enough to see the building.
   */
  const completesRoom = progress.placedCount === ROOM_SLOT_COUNT - 1;

  // The room is drawn at Home's own width so `HomeRoom` lays out identically in
  // both places; the stage only decides where that block sits and how far it is
  // scaled up, which keeps the return trip a single number.
  const roomWidth = getHomeRoomWidth(windowWidth);
  const roomHeight = roomWidth * ROOM_ASPECT;
  const free = windowHeight - insets.top - sheetHeight - spacing.md * 2;
  // Nearly edge to edge, not held to Home's gutters. The room is the whole
  // point of this screen, and the margins that keep it reading as one card
  // among several on Home only cost it size here.
  const stageWidth = Math.min(windowWidth - spacing.sm * 2, free / ROOM_ASPECT);
  const stageScale = stageWidth / roomWidth;
  const stageLeft = (windowWidth - roomWidth) / 2;
  // Centred in the space the sheet leaves, rather than pinned under the status
  // bar: the room is scaled about its own centre, so that centre is the only
  // point worth placing, and the exit measures from it too.
  const stageCentreX = stageLeft + roomWidth / 2;
  const stageCentreY = insets.top + spacing.md + free / 2;
  const stageTop = stageCentreY - roomHeight / 2;

  /**
   * The room fades in once, and only once it can be drawn where it belongs.
   *
   * The room is sized and centred from the sheet's measured height, which
   * arrives a frame after mount. Starting the fade on mount meant the first
   * frames animated a room laid out against a sheet of height zero, which then
   * jumped into place mid-fade. It is rendered from the first frame — so the
   * cost of building a few hundred polygons is paid while it is still fully
   * transparent — and the fade waits for the measurement.
   */
  const entered = useRef(false);
  useEffect(() => {
    if (sheetHeight === 0 || entered.current) return;

    entered.current = true;
    // Overlapping the tail of the cover: the field is already opaque enough to
    // hide the celebration by then, and waiting for it to finish made a short
    // move feel like a long wait.
    const lead = reducedMotion ? 0 : REWARD_FLOW_BEATS.cover * 0.7;
    enter.value = withDelay(
      lead,
      withTiming(1, {
        duration: reducedMotion ? 120 : REWARD_FLOW_BEATS.enter,
        easing: easing.settle,
      }),
    );

    const timer = setTimeout(
      () => setSettled(true),
      lead + REWARD_FLOW_BEATS.enter,
    );
    return () => clearTimeout(timer);
  }, [enter, reducedMotion, sheetHeight]);

  useEffect(() => {
    cover.value = withTiming(1, {
      duration: reducedMotion ? 0 : REWARD_FLOW_BEATS.cover,
      easing: easing.enter,
    });
  }, [cover, reducedMotion]);

  useEffect(() => {
    return () => {
      cancelAnimation(enter);
      cancelAnimation(leave);
      cancelAnimation(railOut);
      cancelAnimation(cover);
    };
  }, [cover, enter, leave, railOut]);

  const close = useCallback(() => {
    // Returning to the frame Home draws the room at: a shrink rather than a
    // dismiss, so the piece that just landed is last seen where it lives.
    //
    // Without an origin — a result screen, which has no room on it to return
    // to — the same animation runs with nowhere to travel: the room settles
    // back to Home's size in place while the field clears. Not the transform,
    // but not the cut either.
    if (reducedMotion) {
      onDismiss();
      return;
    }

    leave.value = withTiming(
      1,
      { duration: REWARD_FLOW_BEATS.exit, easing: easing.enter },
      (finished) => {
        if (finished) runOnJS(onDismiss)();
      },
    );
  }, [leave, onDismiss, origin, reducedMotion]);

  const handleSelect = useCallback((optionId: string) => {
    triggerTapHaptic();
    setSelected(optionId);
  }, []);

  const handlePlace = useCallback(() => {
    if (selected == null) return;
    triggerTapHaptic();
    // The rail leaves before the piece falls, so the landing has the screen.
    railOut.value = withTiming(1, {
      duration: reducedMotion ? 0 : 200,
      easing: easing.exit,
    });
    setCommitted(true);
    if (completesRoom) {
      onSealFrom?.({
        x: stageLeft,
        y: stageTop,
        width: roomWidth,
        scale: stageScale,
      });
    }
    if (!completesRoom && slot != null) {
      setLanding({ slot, option: selected, picks: placedPicks });
    }
    onPlace(selected);
  }, [
    completesRoom,
    onPlace,
    onSealFrom,
    placedPicks,
    railOut,
    reducedMotion,
    roomWidth,
    selected,
    slot,
    stageLeft,
    stageScale,
    stageTop,
  ]);

  /**
   * Placing is the last thing asked of the user. Once the piece is down there
   * is nothing left to decide, so a "Done" button here was a press whose only
   * job was to admit the flow had finished — and it stopped the moment dead
   * between the landing and the room going home. The reveal ends, the piece is
   * held still long enough to be seen in place, and the room leaves on its own.
   */
  useEffect(() => {
    if (!landed) return;

    const timer = setTimeout(close, REWARD_FLOW_BEATS.hold);
    return () => clearTimeout(timer);
  }, [close, landed]);

  const roomStyle = useAnimatedStyle(() => {
    const originCentreX =
      origin == null
        ? stageCentreX
        : origin.x + origin.width / 2;
    const originCentreY =
      origin == null
        ? stageCentreY
        : origin.y + roomHeight / 2;

    const arriving = interpolate(enter.value, [0, 1], [stageScale * 0.94, stageScale]);
    const scale = interpolate(leave.value, [0, 1], [arriving, 1]);

    return {
      opacity: interpolate(enter.value, [0, 0.5], [0, 1], 'clamp'),
      transform: [
        {
          translateX: interpolate(
            leave.value,
            [0, 1],
            [0, originCentreX - stageCentreX],
          ),
        },
        {
          translateY: interpolate(
            leave.value,
            [0, 1],
            [0, originCentreY - stageCentreY],
          ),
        },
        { scale },
      ],
    };
  });

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: cover.value * interpolate(leave.value, [0, 1], [1, 0]),
  }));

  const railStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(enter.value, [0.5, 1], [0, 1], 'clamp') *
      (1 - leave.value) *
      (1 - railOut.value),
    transform: [
      {
        translateY:
          interpolate(enter.value, [0.5, 1], [32, 0], 'clamp') +
          railOut.value * 24,
      },
    ],
  }));

  const body = (
    <View style={StyleSheet.absoluteFill}>
        {/* The only way out without placing, now that the sheet carries just
            the one button. Nothing else up here is touchable. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={StyleSheet.absoluteFill}
          disabled={committed}
          onPress={close}
        >
          <Animated.View style={[styles.field, fieldStyle]} />
        </Pressable>

        <Animated.View
          pointerEvents="none"
          // The room is several hundred polygons across four stacked SVGs, and
          // this fades and scales all of them at once. Flattened to one texture
          // first, that is a cheap transform on a bitmap rather than four
          // vector trees rasterising again every frame.
          shouldRasterizeIOS
          renderToHardwareTextureAndroid
          style={[
            styles.room,
            { left: stageLeft, top: stageTop, width: roomWidth },
            roomStyle,
          ]}
        >
          {landing != null ? (
            <PlacementReveal
              width={roomWidth}
              day={landing.slot}
              option={landing.option}
              picks={landing.picks}
              frameHue={frameHue}
              shell={shell}
              onDone={() => setLanded(true)}
            />
          ) : (
            <HomeRoom
              room={previewRoom}
              progress={progress}
              ghost={
                selected != null ? 'hidden' : settled ? 'pulsing' : 'idle'
              }
              mascot={false}
            />
          )}
        </Animated.View>

        <Animated.View
          onLayout={(event) => {
            // Not once the piece is falling. The sheet empties out for the
            // landing, so its height collapses — and the room, which is
            // centred in the space above it, would slide down into the space
            // that freed up while the object was still in the air.
            if (committed) return;
            setSheetHeight(event.nativeEvent.layout.height);
          }}
          style={[
            styles.rail,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
            railStyle,
          ]}
        >
          {landing != null ? null : day != null && slot != null ? (
            <>
              <Text style={styles.railTitle}>
                {slotLabel == null
                  ? 'Choose a piece'
                  : `Choose a ${slotLabel}`}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.railRow}
              >
                {day.options.map((option) => {
                  const active = selected === option.id;

                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="button"
                      accessibilityLabel={option.name}
                      accessibilityState={{ selected: active }}
                      disabled={!unlocked}
                      style={({ pressed }) => [
                        styles.tile,
                        active && styles.tileSelected,
                        pressed && styles.tilePressed,
                      ]}
                      onPress={() => handleSelect(option.id)}
                    >
                      <View style={styles.well}>
                        <DecorationSolo
                          width={WELL}
                          height={WELL}
                          day={slot}
                          option={option.id}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {/* Standing the whole time, disabled until there is something to
                  place. Appearing only once a tile was tapped moved the thing
                  under the user's thumb at the moment they were reaching. */}
              <ChunkyButton
                label="Place it"
                shape="card"
                disabled={!unlocked || selected == null}
                onPress={handlePlace}
              />
            </>
          ) : null}
      </Animated.View>
    </View>
  );

  if (hosted) {
    return body;
  }

  // Presenting alone, a Modal keeps the tab bar off it: the navigator draws
  // that above every screen, and a celebration with a tab bar across the bottom
  // is not a celebration. `origin` is in window space, which is the space a
  // modal lives in too, so the return trip still lands.
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      {body}
    </Modal>
  );
}

export default memo(DailyRewardFlow);

const styles = StyleSheet.create({
  field: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CELEBRATION_HUE.base,
  },
  room: {
    position: 'absolute',
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // The field, lightened — one surface stepping forward rather than a white
    // card cutting across it. `mid` is `base` with the same hue and more light
    // in it, so the two read as near and far of the same night.
    backgroundColor: CELEBRATION_HUE.mid,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  railTitle: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  railRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tile: {
    ...card.base,
    borderWidth: LINE,
    borderColor: colors.ink,
    width: TILE,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePressed: {
    transform: [{ scale: 0.94 }],
  },
  tileSelected: {
    borderColor: colors.primary.blue500,
    backgroundColor: colors.primary.blue100,
  },
  well: {
    ...card.well,
    width: WELL,
    height: WELL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
});
