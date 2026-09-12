import { memo, useCallback, useEffect, useState } from 'react';
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
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import ChunkyButton from '../../components/common/ChunkyButton';
import HomeRoom from './HomeRoom';
import PlacementReveal from './PlacementReveal';
import DecorationLayer, { DecorationSolo } from './roomStage';
import { getRoomDay, getRoomDayLabel } from './roomDays';
import { toFrameHue, toPicks } from './roomPicks';
import { roomShellPolys } from './roomShells';
import { ROOM_ASPECT } from './roomGeometry';
import { getHomeRoomWidth } from './roomLayout';
import { CELEBRATION_HUE } from './DailyCompleteSheet';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { easing } from '../../theme/motion';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { RoomProgress } from '../../lib/room/roomProgress';
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
  /** the room settles at full size */
  enter: 320,
  /** the slot starts asking */
  slot: 260,
  /** the rail arrives once the room has stopped moving */
  rail: 420,
  /** the room returns to its place on Home */
  exit: 300,
} as const;

const TILE = 92;
/** the room never grows past this share of the screen height */
const STAGE_HEIGHT_SHARE = 0.52;

export interface RewardFlowOrigin {
  /** where Home draws its room, in window coordinates */
  x: number;
  y: number;
  width: number;
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
}

function DailyRewardFlow({
  origin,
  room,
  progress,
  rewardReady,
  onPlace,
  onDismiss,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [selected, setSelected] = useState<string | null>(null);
  const [landing, setLanding] = useState<string | null>(null);
  const [landed, setLanded] = useState(false);

  const enter = useSharedValue(0);
  const leave = useSharedValue(0);

  const slot = progress.nextSlot;
  const day = slot == null ? null : getRoomDay(slot);
  const slotLabel = slot == null ? null : getRoomDayLabel(slot);
  const placedPicks = toPicks(room?.decorations ?? []);
  const unlocked = rewardReady && progress.canClaim;

  // The room is drawn at Home's own width so `HomeRoom` lays out identically in
  // both places; the stage only decides where that block sits and how far it is
  // scaled up, which keeps the return trip a single number.
  const roomWidth = getHomeRoomWidth(windowWidth);
  const stageWidth = Math.min(
    windowWidth - padding.screen.horizontal,
    ((windowHeight * STAGE_HEIGHT_SHARE) / ROOM_ASPECT),
  );
  const stageScale = stageWidth / roomWidth;
  const stageLeft = (windowWidth - roomWidth) / 2;
  const stageTop = insets.top + spacing.xl;
  const stageCentreX = stageLeft + roomWidth / 2;
  const stageCentreY = stageTop + (roomWidth * ROOM_ASPECT) / 2;

  useEffect(() => {
    enter.value = withTiming(1, {
      duration: reducedMotion ? 120 : REWARD_FLOW_BEATS.enter,
      easing: easing.settle,
    });

    return () => {
      cancelAnimation(enter);
      cancelAnimation(leave);
    };
  }, [enter, leave, reducedMotion]);

  const close = useCallback(() => {
    // Returning to the frame Home draws the room at: a shrink rather than a
    // dismiss, so the piece that just landed is last seen where it lives.
    if (origin == null || reducedMotion) {
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
    setLanding(selected);
    onPlace(selected);
  }, [onPlace, selected]);

  const roomStyle = useAnimatedStyle(() => {
    const originCentreX =
      origin == null
        ? stageCentreX
        : origin.x + origin.width / 2;
    const originCentreY =
      origin == null
        ? stageCentreY
        : origin.y + (roomWidth * ROOM_ASPECT) / 2;

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
    opacity: interpolate(leave.value, [0, 1], [1, 0]),
  }));

  const railStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0.5, 1], [0, 1], 'clamp') * (1 - leave.value),
    transform: [
      { translateY: interpolate(enter.value, [0.5, 1], [32, 0], 'clamp') },
    ],
  }));

  return (
    // A Modal, so nothing outside Home sits over this: the tab bar is drawn by
    // the navigator above every screen, and a celebration with a tab bar across
    // the bottom of it is not a celebration. `origin` is in window space, which
    // is the space a modal lives in too, so the return trip still lands.
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.field, fieldStyle]} />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.room,
            { left: stageLeft, top: stageTop, width: roomWidth },
            roomStyle,
          ]}
        >
          {landing != null && slot != null ? (
            <PlacementReveal
              width={roomWidth}
              day={slot}
              option={landing}
              picks={placedPicks}
              frameHue={toFrameHue(room?.frameHue)}
              shell={roomShellPolys(room?.shell)}
              onDone={() => setLanded(true)}
            />
          ) : (
            <>
              <HomeRoom
                room={room}
                progress={progress}
                ghost={selected != null ? 'hidden' : 'pulsing'}
                mascot={false}
              />
              {selected != null && slot != null ? (
                <View style={StyleSheet.absoluteFill}>
                  <DecorationLayer
                    width={roomWidth}
                    day={slot}
                    option={selected}
                  />
                </View>
              ) : null}
            </>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.rail,
            { paddingBottom: insets.bottom + spacing.xl },
            railStyle,
          ]}
        >
          {landed ? (
            <>
              <Text style={styles.railTitle}>
                {slotLabel == null ? 'Placed' : `The ${slotLabel} is in`}
              </Text>
              <ChunkyButton label="Done" onPress={close} />
            </>
          ) : landing != null ? null : day != null && slot != null ? (
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
                {day.options.map((option) => (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityLabel={option.name}
                    accessibilityState={{ selected: selected === option.id }}
                    disabled={!unlocked}
                    style={({ pressed }) => [
                      styles.tile,
                      selected === option.id && styles.tileSelected,
                      pressed && styles.tilePressed,
                    ]}
                    onPress={() => handleSelect(option.id)}
                  >
                    <DecorationSolo
                      width={TILE - spacing.sm * 2}
                      height={TILE - spacing.sm * 2}
                      day={slot}
                      option={option.id}
                    />
                  </Pressable>
                ))}
              </ScrollView>
              {selected == null ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Not now"
                  style={styles.later}
                  onPress={close}
                >
                  <Text style={styles.laterLabel}>Not now</Text>
                </Pressable>
              ) : (
                <ChunkyButton
                  label="Place it"
                  disabled={!unlocked}
                  onPress={handlePlace}
                />
              )}
            </>
          ) : null}
        </Animated.View>
      </View>
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
    paddingTop: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  railTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  railRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.medium,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    ...card.shadow,
  },
  tilePressed: {
    transform: [{ scale: 0.94 }],
  },
  tileSelected: {
    borderWidth: 3,
    borderColor: colors.text.inverse,
  },
  later: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  laterLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.onBlock.textMuted,
  },
});
