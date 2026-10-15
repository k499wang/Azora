import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
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
import RoomReplay from './RoomReplay';
import { radius } from '../../theme/card';
import { decorationRewardPalette } from './decorationRewardPalette';
import RoomPager from './RoomPager';
import { HexRoom } from './RoomScene';
import PagerDots from '../../components/common/PagerDots';
import { toFrameHue, toPicks } from './roomPicks';
import {
  ROOM_STYLES,
  roomShellPolys,
  ROOM_SHELLS,
  toRoomShell,
  type RoomStyle,
} from './roomShells';
import { sealLayout } from './roomSealLayout';
import { REWARD_FLOW_BEATS, type RewardRoomBox } from './DailyRewardFlow';
import { CELEBRATION_HUE } from './DailyCompleteSheet';
import { isRoomOverridden } from './devRoomOverride';
import { useCreateNextRoomMutation } from '../../queries/room/useCreateNextRoomMutation';
import { colors } from '../../theme/colors';
import { duration, easing, stagger, travel } from '../../theme/motion';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { Room } from '../../services/room/roomService';

/**
 * The end of a room, and the start of the next one.
 *
 * Drawn on the same field as the celebration and the decorating stage, and for
 * the same reason: a decoration never leaves the surface it was earned on. The
 * seventh piece, the week replayed, and the choice of where to live next are
 * one moment, and a screen arriving in the middle of it — with its own push
 * animation and its own back stack — is the one thing that can break it.
 *
 * Two questions, one surface. The room stays open on screen and the words
 * change under it, with nothing fading out between them.
 */
/** a room about to be opened: nothing placed, nothing to claim */
const EMPTY_ROOM_PROGRESS = { canClaim: false, placedCount: 0, nextSlot: null };

interface Props {
  userId: string | null;
  /** the finished room — seven pieces, or nothing to replay */
  room: Room | null;
  /**
   * The room's frame on the stage that handed over. The room is the same room
   * and must not jump: it travels from there to where it stands here, while
   * everything around it rises in.
   */
  from?: RewardRoomBox | null;
  /** the next room has been opened, or the user is done here */
  onDone: () => void;
}

export default function RoomSealFlow({
  userId,
  room,
  from = null,
  onDone,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const createNextRoom = useCreateNextRoomMutation(userId);

  const [phase, setPhase] = useState<'rebuild' | 'picking'>('rebuild');
  const [replayDone, setReplayDone] = useState(false);
  const [trayHeight, setTrayHeight] = useState(0);
  /** the surface is on its way out; nothing here is asking anything any more */
  const [leaving, setLeaving] = useState(false);
  const entered = useSharedValue(0);
  /** 0 in place, 1 slid off the bottom */
  const leave = useSharedValue(0);

  const picks = room == null ? null : toPicks(room.decorations);
  const nextFloor = (room?.floor ?? 1) + 1;

  const picking = phase === 'picking';
  // Nothing to replay is not a reason to wait: with no room the replay never
  // mounts, so `replayDone` never comes and the only button on screen stays
  // disabled forever.
  const ready = picking || replayDone || picks == null || room == null;

  const { roomWidth, roomHeight, roomLeft, roomTop, measured } = sealLayout({
    windowWidth,
    windowHeight,
    insetTop: insets.top,
    trayHeight,
    from,
  });

  /** 0 on the finished room, 1 on the picker; they move together like a swipe */
  const slide = useSharedValue(0);
  /** the finished room has slid off and can be let go */
  const [replayGone, setReplayGone] = useState(false);

  const toPicking = useCallback(() => {
    setPhase('picking');
    if (reducedMotion) {
      slide.value = 1;
      setReplayGone(true);
      return;
    }

    slide.value = withTiming(
      1,
      { duration: duration.slow, easing: easing.settle },
      (finished) => {
        if (finished) runOnJS(setReplayGone)(true);
      },
    );
  }, [reducedMotion, slide]);

  // Open on a look they are not already living in, so the next room reads as a
  // new place rather than a repeat of the one they just finished.
  const currentShell = toRoomShell(room?.shell);
  const initialIndex = Math.max(
    0,
    ROOM_STYLES.findIndex((it) => it.shell !== currentShell),
  );
  const [index, setIndex] = useState(initialIndex);
  const style = ROOM_STYLES[index];

  // The room can load after this first renders, which moves the look it opens
  // on. Only while the picker is still closed — once it is on screen the index
  // is the user's, and the pager is scrolled to it.
  useEffect(() => {
    if (picking) return;
    setIndex(initialIndex);
  }, [initialIndex, picking]);

  /**
   * The words wait for the tray to know how tall it is.
   *
   * They are the only thing here that does. The room's size and place come from
   * the stage that handed over, so it is drawn, correctly, on the first frame.
   */
  useEffect(() => {
    if (!measured) return;

    if (reducedMotion) {
      entered.value = 1;
      return;
    }

    // The room is already where it belongs — it never moved — so only the
    // words and the button have anywhere to arrive from.
    entered.value = withDelay(
      stagger.loose,
      withTiming(1, { duration: duration.base, easing: easing.enter }),
    );

    return () => cancelAnimation(entered);
  }, [entered, measured, reducedMotion]);

  useEffect(
    () => () => {
      cancelAnimation(leave);
      cancelAnimation(slide);
    },
    [leave, slide],
  );

  /** the surface sliding away, then letting go */
  const dismiss = useCallback(() => {
    setLeaving(true);

    if (reducedMotion) {
      onDone();
      return;
    }

    leave.value = withTiming(
      1,
      { duration: REWARD_FLOW_BEATS.exit, easing: easing.exit },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
  }, [leave, onDone, reducedMotion]);

  /** the swap between the week replayed and the room being chosen */

  /** the whole surface leaving downwards, the way a sheet does */
  const exitStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: leave.value * windowHeight }],
  }));

  const aroundStyle = useAnimatedStyle(() => ({
    opacity: entered.value * (1 - leave.value),
    transform: [
      { translateY: interpolate(entered.value, [0, 1], [travel.rise, 0]) },
    ],
  }));

  const replayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -slide.value * windowWidth }],
  }));
  const pickerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - slide.value) * windowWidth }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, exitStyle]}>
      {/* Solid until it is gone. Nothing fades it out: thinning it would show
          what is underneath through the thing that is still leaving. */}
      <View style={styles.field} />

      {replayGone ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.room,
            { top: roomTop, left: roomLeft, width: roomWidth },
            replayStyle,
          ]}
        >
          {picks != null && room != null ? (
            <RoomReplay
              width={roomWidth}
              picks={picks}
              frameHue={toFrameHue(room.frameHue)}
              shell={roomShellPolys(room.shell)}
              homeRoom={room}
              onDone={() => setReplayDone(true)}
            />
          ) : (
            <HomeRoom
              room={null}
              progress={EMPTY_ROOM_PROGRESS}
              active={false}
              ghost="hidden"
              mascot={false}
              world
              worldBelow={windowHeight}
              width={roomWidth}
            />
          )}
        </Animated.View>
      )}

      {picking ? (
        <Animated.View
          pointerEvents={leaving ? 'none' : 'auto'}
          style={[
            styles.room,
            { top: 0, left: 0, width: windowWidth },
            pickerStyle,
          ]}
        >
          <RoomPager<RoomStyle>
            onField
            chrome={false}
            items={ROOM_STYLES}
            pageWidth={windowWidth}
            // The whole screen tall, with the room placed where the replay
            // stood, so each page lines up with the room it slides in beside.
            pageHeight={windowHeight}
            initialIndex={initialIndex}
            keyOf={(option) => option.shell}
            captionOf={(option) => option.name}
            onIndexChange={setIndex}
            renderItem={(option) => (
              <View style={[styles.page, { top: roomTop, left: roomLeft }]}>
                <HexRoom
                  width={roomWidth}
                  frameHue={option.frameHue}
                  shell={ROOM_SHELLS[option.shell]}
                />
              </View>
            )}
          />
        </Animated.View>
      ) : null}

      {picking ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.caption,
            { top: roomTop + roomHeight + spacing.md },
            aroundStyle,
          ]}
        >
          <Text style={styles.name}>{style.name}</Text>
          <PagerDots count={ROOM_STYLES.length} index={index} onField />
        </Animated.View>
      ) : null}

      <Animated.View
        // The tallest the tray ever gets, not the tray it happens to be now.
        // Its words change between the two questions, and a tray that grows or
        // shrinks by a line would move the room underneath it — the one thing
        // that has to stand still from the stage to the last room picked.
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setTrayHeight((tallest) => Math.max(tallest, height));
        }}
        style={[
          styles.tray,
          picking ? null : styles.traySheet,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
          aroundStyle,
        ]}
      >
        <Text style={styles.title}>
          {picking && createNextRoom.isError
            ? 'That didn’t open. Have another go.'
            : picking
              ? 'Where next?'
              : 'You filled every corner'}
        </Text>

        <ChunkyButton
          label={
            picking
              ? createNextRoom.isPending
                ? 'Opening…'
                : `Start room ${nextFloor}`
              : 'Pick a new room'
          }
          shape="card"
          // Leaving counts as busy. The mutation is no longer pending by the
          // time the room starts moving, and a second press in that window
          // opens a second floor.
          disabled={picking ? createNextRoom.isPending || leaving : !ready}
          onPress={() => {
            if (!picking) {
              toPicking();
              return;
            }
            if (createNextRoom.isPending) return;

            // The lab previews this against a fabricated room. Opening the next
            // floor is a real write, and a preview must not make one.
            if (isRoomOverridden()) {
              dismiss();
              return;
            }

            createNextRoom.mutate(
              { shell: style.shell, frameHue: style.frameHue },
              // Nothing else to ask for: the new room is empty and today is
              // already spent. The cache is seeded by the time this runs, so
              // whatever is behind the sheet is already drawing the new room.
              { onSuccess: dismiss },
            );
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CELEBRATION_HUE.base,
  },
  room: {
    position: 'absolute',
  },
  page: {
    position: 'absolute',
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  // Under the room it names, where a pager's own caption would be — but drawn
  // outside the room's box, which holds nothing but rooms.
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.title.title3,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  tray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  // Over the replay's floor, which runs to the bottom of the screen.
  traySheet: {
    backgroundColor: decorationRewardPalette.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: 'continuous',
  },
});
