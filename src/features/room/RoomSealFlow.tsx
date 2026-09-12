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
import RoomReplay from './RoomReplay';
import RoomPager from './RoomPager';
import PagerDots from '../../components/common/PagerDots';
import { HexRoom } from './RoomScene';
import { toFrameHue, toPicks } from './roomPicks';
import {
  ROOM_SHELLS,
  ROOM_STYLES,
  roomShellPolys,
  toRoomShell,
  type RoomStyle,
} from './roomShells';
import { ROOM_ASPECT } from './roomGeometry';
import { sealLayout } from './roomSealLayout';
import {
  REWARD_FLOW_BEATS,
  type RewardFlowOrigin,
  type RewardRoomBox,
} from './DailyRewardFlow';
import { CELEBRATION_HUE } from './DailyCompleteSheet';
import { isRoomOverridden } from './devRoomOverride';
import { useCreateNextRoomMutation } from '../../queries/room/useCreateNextRoomMutation';
import { colors } from '../../theme/colors';
import { duration, easing, stagger, travel } from '../../theme/motion';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { Room } from '../../services/room/roomService';

/** how long the screen spends showing nothing while it changes its question */
const SWAP_OUT_MS = 180;

/**
 * The end of a room, and the start of the next one.
 *
 * Drawn on the same field as the celebration and the decorating stage, and for
 * the same reason: a decoration never leaves the surface it was earned on. The
 * seventh piece, the week replayed, and the choice of where to live next are
 * one moment, and a screen arriving in the middle of it — with its own push
 * animation and its own back stack — is the one thing that can break it.
 *
 * Two questions, one surface. Everything fades out together, the words and the
 * room swap while nothing is visible, and it all comes back.
 */
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
  /**
   * Where Home draws its room, so the room chosen here can shrink into it
   * rather than the surface cutting to Home around it — the same return the
   * decorating stage makes, for the same reason: this is the room they will be
   * living in, and they should see it take its place.
   */
  origin?: RewardFlowOrigin | null;
  /** the next room has been opened, or the user is done here */
  onDone: () => void;
}

export default function RoomSealFlow({
  userId,
  room,
  from = null,
  origin = null,
  onDone,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const createNextRoom = useCreateNextRoomMutation(userId);

  const [phase, setPhase] = useState<'rebuild' | 'picking'>('rebuild');
  const [replayDone, setReplayDone] = useState(false);
  const [trayHeight, setTrayHeight] = useState(0);
  /** the room is on its way to Home; nothing here is asking anything any more */
  const [leaving, setLeaving] = useState(false);
  const fade = useSharedValue(1);
  const entered = useSharedValue(0);
  /** 0 standing here, 1 arrived in Home's frame */
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

  const showPicker = useCallback(() => {
    setPhase('picking');
    fade.value = withTiming(1, {
      duration: duration.base,
      easing: easing.enter,
    });
  }, [fade]);

  const toPicking = useCallback(() => {
    if (reducedMotion) {
      showPicker();
      return;
    }

    fade.value = withTiming(
      0,
      { duration: SWAP_OUT_MS, easing: easing.exit },
      (finished) => {
        if (finished) runOnJS(showPicker)();
      },
    );
  }, [fade, reducedMotion, showPicker]);

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
      cancelAnimation(fade);
      cancelAnimation(leave);
    },
    [fade, leave],
  );

  /** the room taking its place on Home, then the surface letting go */
  const toHome = useCallback(() => {
    setLeaving(true);

    if (reducedMotion) {
      onDone();
      return;
    }

    leave.value = withTiming(
      1,
      { duration: REWARD_FLOW_BEATS.exit, easing: easing.enter },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
  }, [leave, onDone, reducedMotion]);

  /** the whole room travelling from the stage's frame to this one */
  /** the room leaving for the frame Home draws it in */
  const roomStyle = useAnimatedStyle(() => {
    const centreX = roomLeft + roomWidth / 2;
    const centreY = roomTop + roomHeight / 2;

    // `origin` is Home's unscaled box, scaled about its own centre, so the
    // centre is the only part of it that carries over.
    const homeCentreX = origin == null ? centreX : origin.x + origin.width / 2;
    const homeCentreY =
      origin == null ? centreY : origin.y + (origin.width * ROOM_ASPECT) / 2;
    const homeScale = origin == null ? 1 : origin.width / roomWidth;

    return {
      // Nothing handed over, so nothing to draw until the tray has said how
      // much room is left.
      opacity: from == null && !measured ? 0 : fade.value,
      transform: [
        {
          translateX: interpolate(
            leave.value,
            [0, 1],
            [0, homeCentreX - centreX],
          ),
        },
        {
          translateY: interpolate(
            leave.value,
            [0, 1],
            [0, homeCentreY - centreY],
          ),
        },
        { scale: interpolate(leave.value, [0, 1], [1, homeScale]) },
      ],
    };
  });

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: 1 - leave.value,
  }));

  const aroundStyle = useAnimatedStyle(() => ({
    opacity: fade.value * entered.value * (1 - leave.value),
    transform: [
      { translateY: interpolate(entered.value, [0, 1], [travel.rise, 0]) },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* The field is its own layer rather than the room's parent, so it can
          clear while the room stays solid all the way into Home's frame. */}
      <Animated.View style={[styles.field, fieldStyle]} />

      <Animated.View
        pointerEvents={picking && !leaving ? 'auto' : 'none'}
        // Flattened only while it travels to Home. A cached bitmap cannot show
        // what changes inside it, and plenty changes: the week rebuilds itself
        // piece by piece, and the pager scrolls through seven rooms.
        shouldRasterizeIOS={leaving}
        renderToHardwareTextureAndroid={leaving}
        style={[
          styles.room,
          // Picking only widens the box, never the room: the pages are a
          // screen across so they can be swiped, while each page is pinned to
          // the room's own height. The room itself stands in the same place
          // throughout, which is what lets it leave for Home from there.
          { top: roomTop },
          picking && !leaving
            ? { left: 0, width: windowWidth }
            : { left: roomLeft, width: roomWidth },
          roomStyle,
        ]}
      >
        {leaving ? (
          // Only the chosen room leaves. The pager is a row of them, and the
          // page it is parked on is the same picture in the same box, so
          // dropping it for the one room is invisible.
          <HexRoom
            width={roomWidth}
            frameHue={style.frameHue}
            shell={ROOM_SHELLS[style.shell]}
          />
        ) : picking ? (
          <RoomPager<RoomStyle>
            onField
            chrome={false}
            items={ROOM_STYLES}
            pageWidth={windowWidth}
            pageHeight={roomHeight}
            initialIndex={initialIndex}
            keyOf={(option) => option.shell}
            captionOf={(option) => option.name}
            onIndexChange={setIndex}
            renderItem={(option) => (
              <HexRoom
                width={roomWidth}
                frameHue={option.frameHue}
                shell={ROOM_SHELLS[option.shell]}
              />
            )}
          />
        ) : picks != null && room != null ? (
          <RoomReplay
            width={roomWidth}
            picks={picks}
            frameHue={toFrameHue(room.frameHue)}
            shell={roomShellPolys(room.shell)}
            onDone={() => setReplayDone(true)}
          />
        ) : (
          <HexRoom
            width={roomWidth}
            picks={{}}
            frameHue={toFrameHue(undefined)}
            shell={roomShellPolys(undefined)}
          />
        )}
      </Animated.View>

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
              toHome();
              return;
            }

            createNextRoom.mutate(
              { shell: style.shell, frameHue: style.frameHue },
              // Home rather than anywhere else: the new room is empty and
              // today is already spent, so there is nothing to do in it — and
              // the room goes there itself rather than the screen cutting to
              // it. The cache is seeded by then, so Home is already drawing
              // this exact room under the field.
              { onSuccess: toHome },
            );
          }}
        />
      </Animated.View>
    </View>
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
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  // Under the room it names, where a pager's own caption would be — but drawn
  // outside the room's box, so that the thing that flies to Home is nothing
  // but the room.
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
});
