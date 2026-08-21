/**
 * The hotel, as one pinchable honeycomb.
 *
 * Every room is a hexagon in a pyramid, drawn with its own shell and frame from
 * the day it opens — the one being decorated right now included, part-furnished
 * or still empty. The one slot that is marked without holding a room is the
 * next one: a dashed outline where the room after this one will stand, so the
 * pyramid shows where it is going rather than just where it has been.
 *
 * It opens on the whole hotel at once, so a new room shows up in place rather
 * than needing to be panned to.
 *
 * Rooms are drawn two ways, and which one is in use is the only thing that
 * changes as you zoom:
 *
 *   · far — the whole pyramid as a single texture, one draw call, so a pinch
 *     costs the same whether the hotel has three rooms or fifty-five
 *   · close — the rooms as recorded `Picture`s again, sharp at any
 *     magnification, affordable because Skia rejects the ones off screen
 *
 * The swap happens at the scale where the texture stops out-resolving the
 * display, and it is a single re-render at a threshold rather than anything
 * that runs per frame.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  Canvas,
  FilterMode,
  Group,
  Image,
  MipmapMode,
  Picture,
  Skia,
  createPicture,
  type SkCanvas,
  type SkPicture,
} from '@shopify/react-native-skia';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { usePinchZoomPan } from './usePinchZoomPan';
import { decorationPaths, framePaths, ghostPaths, paintedPaths } from './roomPaths';
import type { PaintedPath } from './roomPaths';
import { snapshotPyramid, type FarView } from './pyramidSnapshot';
import { HEX_W, fitToViewport, pyramidBounds, slotAt } from './pyramidLayout';
import { VIEW_BOX_HEIGHT, VIEW_BOX_WIDTH } from './RoomScene';
import type { FrameHue, Picks, Poly } from './RoomScene';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import GlassIconButton from '../../components/common/GlassIconButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';

/** a single room, filling the screen */
const CLOSE_SCALE = 1;
const MAX_SCALE = 3;
/** a pinch can settle a little looser than everything at once, but not much */
const MIN_SCALE_FACTOR = 0.7;
const FIT_MARGIN = 28;
/** one tap of a zoom control, as a multiple of the scale */
const ZOOM_STEP = 1.6;
const ZOOM_ICON_SIZE = 20;

/**
 * How far back below the texture's limit the canvas has to come before it goes
 * back to the texture. Without the gap a pinch resting on the threshold would
 * re-render on every frame it wobbled across it.
 */
const FAR_HYSTERESIS = 0.8;

const PIXEL_RATIO = PixelRatio.get();

/**
 * The label is authored in viewBox units like the artwork, so it belongs to the
 * slot rather than floating at a fixed size over it: zoom in and it grows with
 * the hexagon it is captioning, and the copy wraps the same way at every zoom
 * because it is laid out once and only transformed after.
 *
 * It is laid out at `MAX_SCALE` and scaled *down* from there, never up. A view
 * transformed past its layout size is resampled rather than re-laid-out, so
 * text scaled up blurs exactly the way a baked texture does — the same reason
 * the outline is drawn live instead of into the snapshot.
 *
 * Below `LABEL_MIN_SLOT` it fades out instead of shrinking into a smudge:
 * standing that far back is standing far enough back that the caption is no
 * longer the question.
 */
const LABEL_WIDTH_UNITS = 260;
const LABEL_HEIGHT_UNITS = 170;
const LABEL_ICON_UNITS = 44;
const LABEL_GAP_UNITS = 10;
/** the caption's own ratio, held at the scale the artwork is drawn in */
const LABEL_FONT_UNITS = 26;
const LABEL_LINE_UNITS = 34;

/** how wide the slot has to be on screen, in points, to be worth captioning */
const LABEL_MIN_SLOT = 132;
const LABEL_FADE_MS = 160;

export interface PyramidRoom {
  key: string;
  /** 1 for the apex; the room's permanent place in the pyramid */
  floor: number;
  shell: Poly[];
  picks: Picks;
  frameHue: FrameHue;
}

interface Props {
  rooms: PyramidRoom[];
}

function draw(canvas: SkCanvas, paths: PaintedPath[]) {
  for (const painted of paths) canvas.drawPath(painted.path, painted.paint);
}

/**
 * Anything drawn in a slot, recorded where it stands.
 *
 * The slot offset goes into the recording rather than onto a wrapping `Group`,
 * so the scene is a flat list of pictures with nothing to walk between them —
 * and the cull rect is in the same space as the canvas, which lets Skia reject
 * a room outright when it is off screen.
 */
function recordSlot(
  index: number,
  paint: (canvas: SkCanvas) => void,
): SkPicture {
  const { x, y } = slotAt(index);
  const bounds = Skia.XYWHRect(
    x - VIEW_BOX_WIDTH / 2,
    y - VIEW_BOX_HEIGHT / 2,
    VIEW_BOX_WIDTH,
    VIEW_BOX_HEIGHT,
  );

  return createPicture((canvas) => {
    canvas.translate(x, y);
    paint(canvas);
  }, bounds);
}

function recordRoom(room: PyramidRoom): SkPicture {
  return recordSlot(room.floor - 1, (canvas) => {
    draw(canvas, paintedPaths(room.shell));
    draw(canvas, decorationPaths(room.picks));
    draw(canvas, framePaths(room.frameHue));
  });
}

export default function PyramidCanvas({ rooms }: Props) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const floors = useMemo(
    () => rooms.filter((room) => room.floor >= 1),
    [rooms],
  );
  const highestFloor = floors.reduce(
    (top, room) => Math.max(top, room.floor),
    0,
  );

  const pictures = useMemo(
    () =>
      floors.map((room) => ({ key: room.key, picture: recordRoom(room) })),
    [floors],
  );

  /**
   * The outline is drawn live at every zoom, and is deliberately the one thing
   * kept out of the flattened texture.
   *
   * Rooms are broad areas of flat colour and survive being resampled. A thin
   * dashed stroke does not: baked into the texture, some dashes land on texel
   * centres and stay sharp while the ones that straddle are blurred across two,
   * so a stroke of constant width reads as though it changes thickness. Kept as
   * a path it is re-stroked by the GPU at whatever scale the canvas is at, and
   * costs two draw calls to do it.
   */
  const ghost = useMemo(
    () => recordSlot(highestFloor, (canvas) => draw(canvas, ghostPaths())),
    [highestFloor],
  );

  const nextSlot = useMemo(() => slotAt(highestFloor), [highestFloor]);

  // What the texture covers: the rooms and nothing else, now that the outline
  // is drawn over it rather than into it.
  const roomBounds = useMemo(
    () => pyramidBounds(highestFloor),
    [highestFloor],
  );

  // What the canvas is framed against: one slot more, so the hotel stands back
  // far enough to show where the next room goes instead of cropping it at the
  // edge of the screen.
  const bounds = useMemo(
    () => pyramidBounds(highestFloor + 1),
    [highestFloor],
  );

  const home = useMemo(() => {
    if (size == null) return null;
    return fitToViewport(bounds, size.width, size.height, FIT_MARGIN);
  }, [size, bounds]);

  const { scale, translateX, translateY, gesture, zoomBy } = usePinchZoomPan({
    home,
    minScaleFactor: MIN_SCALE_FACTOR,
    maxScale: MAX_SCALE,
    closeScale: CLOSE_SCALE,
  });

  const transform = useDerivedValue(() => [
    { translateX: translateX.value },
    { translateY: translateY.value },
    { scale: scale.value },
  ]);

  const [far, setFar] = useState<FarView | null>(null);
  const [close, setClose] = useState(false);

  const homeScale = home?.scale ?? null;

  // The hotel is a tab, so it stays mounted once it has been opened. A texture
  // this size has no business outliving the view of it: it is thrown away when
  // the tab loses focus and rebuilt on the way back in, behind the transition.
  const focused = useIsFocused();

  // Flattening the pyramid replays every room once, which is the same work one
  // frame used to cost. Paid here, on a layout or a new room, instead of sixty
  // times a second forever.
  useEffect(() => {
    if (homeScale == null || !focused) {
      setFar(null);
      return;
    }

    setFar(
      snapshotPyramid({
        pictures: pictures.map((slot) => slot.picture),
        bounds: roomBounds,
        homeScale,
        pixelRatio: PIXEL_RATIO,
      }),
    );
  }, [pictures, roomBounds, homeScale, focused]);

  // Freed one render late, on purpose. Effects run after commit, so whatever
  // this replaces is already out of the canvas — releasing it during the render
  // that drops it would leave a frame drawing a texture that no longer exists.
  const shown = useRef<FarView | null>(null);

  useEffect(() => {
    const previous = shown.current;
    shown.current = far;
    previous?.image.dispose();
  }, [far]);

  useEffect(() => () => shown.current?.image.dispose(), []);

  const farLimit = useSharedValue(Infinity);
  const isClose = useSharedValue(false);

  useEffect(() => {
    farLimit.value = far?.limit ?? Infinity;
  }, [far, farLimit]);

  useAnimatedReaction(
    () => scale.value,
    (value) => {
      if (!isClose.value && value > farLimit.value) {
        isClose.value = true;
        runOnJS(setClose)(true);
      } else if (isClose.value && value < farLimit.value * FAR_HYSTERESIS) {
        isClose.value = false;
        runOnJS(setClose)(false);
      }
    },
  );

  // Follows the slot without re-rendering: the same shared values the canvas is
  // transformed by, applied to a plain view over it. The scale is used to place
  // the label, never to size it.
  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(HEX_W * scale.value >= LABEL_MIN_SLOT ? 1 : 0, {
      duration: LABEL_FADE_MS,
    }),
    transform: [
      { translateX: translateX.value + nextSlot.x * scale.value },
      { translateY: translateY.value + nextSlot.y * scale.value },
      { scale: scale.value / MAX_SCALE },
    ],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (size != null && size.width === width && size.height === height) return;
    setSize({ width, height });
  };

  const zoom = (factor: number) => {
    if (size == null) return;
    zoomBy(factor, size.width / 2, size.height / 2);
  };

  const showFar = far != null && !close;

  return (
    <View style={styles.canvas} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={transform}>
            {showFar ? (
              <Image
                image={far.image}
                x={far.x}
                y={far.y}
                width={far.width}
                height={far.height}
                fit="fill"
                // The texture is deliberately larger than the screen needs, so
                // it is always being minified — without mipmaps that is where
                // a fine floor pattern turns into a shimmer under a pinch.
                sampling={{
                  filter: FilterMode.Linear,
                  mipmap: MipmapMode.Linear,
                }}
              />
            ) : (
              pictures.map((slot) => (
                <Picture key={slot.key} picture={slot.picture} />
              ))
            )}

            <Picture picture={ghost} />
          </Group>
        </Canvas>
      </GestureDetector>

      <Animated.View style={[styles.label, labelStyle]} pointerEvents="none">
        <Icon
          name="room-hex"
          size={LABEL_ICON_UNITS * MAX_SCALE}
          color={colors.text.tertiary}
        />
        <Text style={styles.labelText}>
          Finish this floor to open your next room
        </Text>
      </Animated.View>

      <View style={styles.zoom} pointerEvents="box-none">
        <GlassIconButton
          accessibilityLabel="Zoom in"
          onPress={() => zoom(ZOOM_STEP)}
        >
          <Icon name="zoom-in" size={ZOOM_ICON_SIZE} color={colors.text.primary} />
        </GlassIconButton>
        <GlassIconButton
          accessibilityLabel="Zoom out"
          onPress={() => zoom(1 / ZOOM_STEP)}
        >
          <Icon
            name="zoom-out"
            size={ZOOM_ICON_SIZE}
            color={colors.text.primary}
          />
        </GlassIconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  // Anchored at the canvas's origin and moved from there by the transform, so
  // the margins are what centre it on the slot rather than a layout pass.
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: LABEL_WIDTH_UNITS * MAX_SCALE,
    height: LABEL_HEIGHT_UNITS * MAX_SCALE,
    marginLeft: (-LABEL_WIDTH_UNITS * MAX_SCALE) / 2,
    marginTop: (-LABEL_HEIGHT_UNITS * MAX_SCALE) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: LABEL_GAP_UNITS * MAX_SCALE,
  },
  // The caption token, restated at the artwork's scale: same family, same
  // weight, same size-to-leading ratio, in units rather than points.
  labelText: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontSize: LABEL_FONT_UNITS * MAX_SCALE,
    lineHeight: LABEL_LINE_UNITS * MAX_SCALE,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  // Over the canvas rather than in a header: the hotel has no top bar to sit
  // in, and a header would push the pyramid down the screen to hold them.
  zoom: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
