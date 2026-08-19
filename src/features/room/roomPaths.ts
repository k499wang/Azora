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

export function framePaths(hue: FrameHue): PaintedPath[] {
  return paintedPaths(ROOM_FRAME[hue]);
}
