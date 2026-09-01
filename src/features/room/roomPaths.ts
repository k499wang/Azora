/**
 * The room's artwork, as Skia paths.
 *
 * `RoomScene` draws a room as one SVG `<Polygon>` per shape, which is right for
 * a single room on a still screen and wrong for a hotel of them under a pinch:
 * scaling an SVG layer re-rasterises every polygon on the CPU each frame. Skia
 * keeps the paths and lets the GPU transform them, so zoom costs nothing and
 * stays sharp at any magnification.
 *
 * Same artwork, same `Poly` data, different renderer — nothing is redrawn here.
 *
 * Two things keep this cheap:
 *   · runs of neighbouring shapes that share a paint merge into one path, which
 *     is safe only while they are adjacent — these are flat fills stacked back
 *     to front, so reordering them would change the picture
 *   · results are cached against the `Poly[]` itself, and every array in
 *     `RoomScene` and `roomShells` is a module constant, so the forty-four
 *     distinct pieces of artwork are each built once for the whole app
 */
import { PaintStyle, Skia, type SkPaint, type SkPath } from '@shopify/react-native-skia';
import { DECOR, PAINT_ORDER, ROOM_FRAME } from './RoomScene';
import { colors } from '../../theme/colors';
import type { DayKey, FrameHue, Picks, Poly } from './RoomScene';

/**
 * A shape and the paint it is drawn with, both built once and kept. Recording a
 * room is then a walk of `drawPath` calls that allocates nothing, which is what
 * makes swapping detail in mid-pinch free.
 */
export interface PaintedPath {
  path: SkPath;
  paint: SkPaint;
}

/**
 * `rgba(58,67,79,.05)` is valid CSS and not something Skia's colour parser
 * accepts — it wants the leading zero.
 */
function readableColor(color: string): string {
  return color.replace(/,\s*\./g, ',0.');
}

function toPath(polys: Poly[], from: number, to: number): SkPath {
  const path = Skia.Path.Make();

  for (let i = from; i <= to; i += 1) {
    const points = polys[i].p
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [x, y] = pair.split(',');
        return { x: Number(x), y: Number(y) };
      });

    path.addPoly(points, true);
  }

  return path;
}

/** what makes two neighbouring shapes mergeable: the same paint, exactly */
function paintKey(poly: Poly): string {
  return `${poly.f ?? ''}|${poly.s ?? ''}|${poly.w ?? 0}|${poly.o ?? 1}`;
}

function toPaint(poly: Poly, color: string): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(readableColor(color)));

  // Only when the artwork asks for it. `setColor` has already taken the alpha
  // out of an `rgba(...)` fill, and setting it again here would flatten every
  // contact shadow in the room to fully opaque grey.
  if (poly.o != null) paint.setAlphaf(poly.o);

  if (poly.f == null && poly.w != null) {
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(poly.w);
  }

  return paint;
}

function build(polys: Poly[]): PaintedPath[] {
  const painted: PaintedPath[] = [];
  let start = 0;

  while (start < polys.length) {
    const key = paintKey(polys[start]);
    let end = start;
    while (end + 1 < polys.length && paintKey(polys[end + 1]) === key) end += 1;

    const poly = polys[start];
    const color = poly.f ?? poly.s;

    if (color != null) {
      painted.push({
        path: toPath(polys, start, end),
        paint: toPaint(poly, color),
      });
    }

    start = end + 1;
  }

  return painted;
}

const cache = new WeakMap<Poly[], PaintedPath[]>();

export function paintedPaths(polys: Poly[]): PaintedPath[] {
  const hit = cache.get(polys);
  if (hit != null) return hit;

  const built = build(polys);
  cache.set(polys, built);

  return built;
}

/**
 * A room's furniture, back to front.
 *
 * Paint order is `RoomScene`'s, not the order the days were earned — the piece
 * against the back wall has to be drawn before the one standing in front of it
 * whichever day each was placed.
 */
export function decorationPaths(picks: Picks): PaintedPath[] {
  const paths: PaintedPath[] = [];

  for (const day of PAINT_ORDER) {
    const polys = decorationPolys(day, picks[day]);
    if (polys != null) paths.push(...paintedPaths(polys));
  }

  return paths;
}

function decorationPolys(day: DayKey, option: string | undefined) {
  return option == null ? undefined : DECOR[`${day}.${option}`];
}

/**
 * The hexagon every room is cut to, and how far off-centre a stroke sits.
 *
 * It is regular: all six vertices are 180 from the centre and all six sides are
 * 180 long, so the apothem — centre to the middle of an edge — is the one
 * number an inset is measured against.
 */
const HEX_VERTICES: readonly (readonly [number, number])[] = [
  [0, -180],
  [-155.9, -90],
  [-155.9, 90],
  [0, 180],
  [155.9, 90],
  [155.9, -90],
];
const HEX_APOTHEM = 155.9;

/**
 * Rooms tessellate, so neighbours do not sit next to a shared edge — they sit
 * on it. A frame drawn per room therefore paints the same line twice and the
 * second one wins, which is why a room used to be outlined in its own hue on
 * some sides and its neighbour's on the rest.
 *
 * So the honeycomb is mortar and rooms are what is set into it: one lattice for
 * the whole pyramid in a single colour, where drawing an edge twice is drawing
 * it the same both times, and each room's hue as a ring inset far enough to
 * clear it. Interior seams and the pyramid's outer edge then look alike, which
 * per-room frames could not manage in either arrangement.
 */
const LATTICE_STROKE = 10;

/**
 * How much room the frame is given, which is wider than the line it now draws:
 * the hex used to carry a colour band under the ink, and the mortar around it
 * was cut to clear that band. Keeping the clearance keeps the pyramid's layout.
 */
const FRAME_STROKE = 14;

/** far enough in that the frame's outer edge meets the mortar's inner edge */
const ACCENT_INSET = LATTICE_STROKE / 2 + FRAME_STROKE / 2;

function hexPoints(inset: number) {
  const factor = (HEX_APOTHEM - inset) / HEX_APOTHEM;

  return HEX_VERTICES.map(([x, y]) => ({ x: x * factor, y: y * factor }));
}

function strokePaint(color: string, width: number): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);

  return paint;
}

/**
 * Every room's outline as one path, stroked once.
 *
 * Shared edges are drawn twice over and it does not show, because both passes
 * lay down the same colour at the same width — the whole point of moving the
 * outline off the rooms and into the pyramid.
 */
export function latticePath(
  centres: readonly { x: number; y: number }[],
): PaintedPath {
  const path = Skia.Path.Make();
  const points = hexPoints(0);

  for (const centre of centres) {
    path.addPoly(
      points.map((point) => ({ x: centre.x + point.x, y: centre.y + point.y })),
      true,
    );
  }

  return {
    path,
    paint: strokePaint(colors.neutral[0], LATTICE_STROKE),
  };
}

const accents = new Map<FrameHue, PaintedPath[]>();

/**
 * The room's frame, set inside the mortar rather than shared with it.
 *
 * Not a new border: it is `ROOM_FRAME`'s outline — the same ink, at the same
 * widths the home room draws it, though without the wall thickness those lines
 * wrap at full size — on a hexagon pulled in far
 * enough to clear the lattice. A room in the pyramid is outlined exactly as it
 * is anywhere else in the app; only what sits between rooms is new.
 */
export function accentPaths(hue: FrameHue): PaintedPath[] {
  const hit = accents.get(hue);
  if (hit != null) return hit;

  const path = Skia.Path.Make();
  path.addPoly(hexPoints(ACCENT_INSET), true);

  const built: PaintedPath[] = [];

  for (const poly of ROOM_FRAME[hue]) {
    // the frame's shaded faces are fills; only its outline survives the trip
    if (poly.f != null) continue;
    const color = poly.s;
    if (color == null || poly.w == null) continue;

    built.push({ path, paint: strokePaint(readableColor(color), poly.w) });
  }

  accents.set(hue, built);

  return built;
}

/**
 * The slot the next room will stand in.
 *
 * Deliberately not drawn like a room: a dashed outline over a barely-there
 * fill, so the pyramid reads as having somewhere to grow without the empty
 * slot competing with the rooms that are actually furnished. The stroke and
 * dash are in viewBox units like everything else, so they thin out with the
 * rest of the artwork as you stand back instead of staying a fixed hairline.
 *
 * Built once — there is only ever one of these on screen.
 */
const GHOST_HEX = '0,-180 -155.9,-90 -155.9,90 0,180 155.9,90 155.9,-90';

/**
 * Lighter than the frame a real room carries, and derived from it rather than
 * guessed at, so the empty slot stays in proportion with the rooms around it
 * however the frame is redrawn — a slot waiting to be filled should not draw
 * the eye harder than the rooms that already are.
 */
const GHOST_WEIGHT = 0.6;
const GHOST_STROKE = FRAME_STROKE * GHOST_WEIGHT;

/**
 * Every side of the hexagon is exactly 180 units long. A dash period that
 * divides 180 therefore reaches all six corners at the same point in the
 * pattern, and starting half a dash in centres one on every vertex — otherwise
 * a corner falls mid-dash here and in a gap there, and the outline reads as
 * uneven even though the stroke never changes.
 */
const GHOST_SIDE = 180;
const GHOST_DASHES_PER_SIDE = 4;
const GHOST_PERIOD = GHOST_SIDE / GHOST_DASHES_PER_SIDE;
/** two parts ink to one part air */
const GHOST_DASH = (GHOST_PERIOD * 2) / 3;

let ghost: PaintedPath[] | null = null;

export function ghostPaths(): PaintedPath[] {
  if (ghost != null) return ghost;

  const path = toPath([{ p: GHOST_HEX }], 0, 0);

  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setColor(Skia.Color(colors.neutral[100]));

  const outline = Skia.Paint();
  outline.setAntiAlias(true);
  outline.setColor(Skia.Color(colors.border.strong));
  outline.setStyle(PaintStyle.Stroke);
  outline.setStrokeWidth(GHOST_STROKE);
  outline.setPathEffect(
    Skia.PathEffect.MakeDash(
      [GHOST_DASH, GHOST_PERIOD - GHOST_DASH],
      GHOST_DASH / 2,
    ),
  );

  ghost = [
    { path, paint: fill },
    { path, paint: outline },
  ];

  return ghost;
}
