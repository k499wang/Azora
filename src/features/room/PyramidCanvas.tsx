/**
 * The hotel, as one pinchable honeycomb.
 *
 * Every room is a hexagon in a pyramid, drawn with its own shell and frame from
 * the day it opens — the one being decorated right now included, part-furnished
 * or still empty. Nothing marks a slot that has no room in it: the pyramid is
 * the rooms, and the empty space beside them is where the next ones will go.
 * It opens on the whole hotel at once, so a new room shows up in place rather
 * than needing to be panned to.
 *
 * Each room is recorded once into a Skia `Picture`, already positioned in its
 * slot, and drawn as a single op. A pinch rebuilds no React elements and
 * re-parses no artwork however far out you stand, so the furniture can stay
 * drawn at every zoom — a pyramid of rooms you furnished should look furnished
 * from across the room.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  Canvas,
  Group,
  Picture,
  Skia,
  createPicture,
  type SkCanvas,
  type SkPicture,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { usePinchZoomPan } from './usePinchZoomPan';
import { decorationPaths, framePaths, paintedPaths } from './roomPaths';
import type { PaintedPath } from './roomPaths';
import { fitToViewport, pyramidBounds, slotAt } from './pyramidLayout';
import { VIEW_BOX_HEIGHT, VIEW_BOX_WIDTH } from './RoomScene';
import type { FrameHue, Picks, Poly } from './RoomScene';
import Icon from '../../components/common/icons/Icon';
import GlassIconButton from '../../components/common/GlassIconButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

/** a single room, filling the screen */
const CLOSE_SCALE = 1;
const MAX_SCALE = 3;
/** a pinch can settle a little looser than everything at once, but not much */
const MIN_SCALE_FACTOR = 0.7;
const FIT_MARGIN = 28;
/** one tap of a zoom control, as a multiple of the scale */
const ZOOM_STEP = 1.6;
const ZOOM_ICON_SIZE = 20;

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
 * One room, recorded where it stands.
 *
 * The slot offset goes into the recording rather than onto a wrapping `Group`,
 * so the scene is a flat list of pictures with nothing to walk between them —
 * and the cull rect is in the same space as the canvas, which lets Skia reject
 * a room outright when it is off screen.
 */
function recordRoom(room: PyramidRoom, x: number, y: number): SkPicture {
  const bounds = Skia.XYWHRect(
    x - VIEW_BOX_WIDTH / 2,
    y - VIEW_BOX_HEIGHT / 2,
    VIEW_BOX_WIDTH,
    VIEW_BOX_HEIGHT,
  );

  return createPicture((canvas) => {
    canvas.translate(x, y);
    draw(canvas, paintedPaths(room.shell));
    draw(canvas, decorationPaths(room.picks));
    draw(canvas, framePaths(room.frameHue));
  }, bounds);
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

  const home = useMemo(() => {
    if (size == null) return null;

    return fitToViewport(
      pyramidBounds(highestFloor),
      size.width,
      size.height,
      FIT_MARGIN,
    );
  }, [size, highestFloor]);

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

  const pictures = useMemo(
    () =>
      floors.map((room) => {
        const { x, y } = slotAt(room.floor - 1);
        return { key: room.key, picture: recordRoom(room, x, y) };
      }),
    [floors],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (size != null && size.width === width && size.height === height) return;
    setSize({ width, height });
  };

  const zoom = (factor: number) => {
    if (size == null) return;
    zoomBy(factor, size.width / 2, size.height / 2);
  };

  return (
    <View style={styles.canvas} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={transform}>
            {pictures.map((room) => (
              <Picture key={room.key} picture={room.picture} />
            ))}
          </Group>
        </Canvas>
      </GestureDetector>

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
