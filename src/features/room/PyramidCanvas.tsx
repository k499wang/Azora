/**
 * The hotel, as one pinchable honeycomb.
 *
 * Every finished room is a hexagon in a pyramid, and the next one to come is a
 * dotted outline waiting under them.
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
  DashPathEffect,
  Group,
  Path,
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
import { colors } from '../../theme/colors';

/** a single room, filling the screen */
const CLOSE_SCALE = 1;
const MAX_SCALE = 3;
/** a pinch can settle a little looser than everything at once, but not much */
const MIN_SCALE_FACTOR = 0.7;
const FIT_MARGIN = 28;

/** the outline of the next room, in points on the glass — dash then gap */
const GHOST_STROKE_PX = 1.25;
const GHOST_DASH_PX = 5;
const GHOST_GAP_PX = 5;

/** the hexagon itself, tighter than the viewBox around it */
const HEX_HALF_W = 155.9;
const HEX_HALF_H = 180;

const HEX_POINTS = [
  { x: 0, y: -HEX_HALF_H },
  { x: -HEX_HALF_W, y: -HEX_HALF_H / 2 },
  { x: -HEX_HALF_W, y: HEX_HALF_H / 2 },
  { x: 0, y: HEX_HALF_H },
  { x: HEX_HALF_W, y: HEX_HALF_H / 2 },
  { x: HEX_HALF_W, y: -HEX_HALF_H / 2 },
];

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

  const highestFloor = rooms.reduce((top, room) => Math.max(top, room.floor), 0);

  const home = useMemo(() => {
    if (size == null) return null;

    // Every room earned, plus the one slot waiting for the next.
    const bounds = pyramidBounds(highestFloor + 1);

    return fitToViewport(bounds, size.width, size.height, FIT_MARGIN);
  }, [size, highestFloor]);

  // The hotel opens on the newest room, close enough to see its furniture — the
  // one the user just spent seven days on is the one worth landing on, and the
  // rest of the pyramid is a double-tap away.
  const start = useMemo(() => {
    if (size == null) return null;

    const newest = slotAt(Math.max(0, highestFloor - 1));

    return {
      scale: CLOSE_SCALE,
      x: size.width / 2 - newest.x * CLOSE_SCALE,
      y: size.height / 2 - newest.y * CLOSE_SCALE,
    };
  }, [size, highestFloor]);

  const { scale, translateX, translateY, gesture } = usePinchZoomPan({
    home,
    start,
    minScaleFactor: MIN_SCALE_FACTOR,
    maxScale: MAX_SCALE,
    closeScale: CLOSE_SCALE,
  });

  const transform = useDerivedValue(() => [
    { translateX: translateX.value },
    { translateY: translateY.value },
    { scale: scale.value },
  ]);

  // The outline has to read the same at every zoom, so it is measured in points
  // and divided back out of the scale rather than growing with the artwork.
  const ghostStroke = useDerivedValue(() => GHOST_STROKE_PX / scale.value);
  const ghostDash = useDerivedValue(() => [
    GHOST_DASH_PX / scale.value,
    GHOST_GAP_PX / scale.value,
  ]);

  const scene = useMemo(() => {
    // Only the next room is outlined. Every unbuilt slot after it was a
    // fifty-hexagon wireframe that read as scaffolding around the rooms rather
    // than a place for them; one dotted hexagon says the same thing.
    const next = slotAt(highestFloor);
    const ghost = Skia.Path.Make();
    ghost.addPoly(
      HEX_POINTS.map((point) => ({
        x: point.x + next.x,
        y: point.y + next.y,
      })),
      true,
    );

    const pictures = rooms
      .filter((room) => room.floor >= 1)
      .map((room) => {
        const { x, y } = slotAt(room.floor - 1);
        return { key: room.key, picture: recordRoom(room, x, y) };
      });

    return { ghost, pictures };
  }, [rooms, highestFloor]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (size != null && size.width === width && size.height === height) return;
    setSize({ width, height });
  };

  return (
    <View style={styles.canvas} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={transform}>
            <Path
              path={scene.ghost}
              color={colors.border.default}
              style="stroke"
              strokeWidth={ghostStroke}
            >
              <DashPathEffect intervals={ghostDash} />
            </Path>
            {scene.pictures.map((room) => (
              <Picture key={room.key} picture={room.picture} />
            ))}
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
