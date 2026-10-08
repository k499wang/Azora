import { Skia, type SkPath } from '@shopify/react-native-skia';
import { chart } from './chartTokens';

export interface ChartPoint {
  x: number;
  y: number;
}

export interface PlotBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The plotting area inside a chart canvas of the given width. */
export function plotBox(width: number): PlotBox {
  return {
    left: chart.padLeft,
    top: chart.padTop,
    width: Math.max(0, width - chart.padLeft - chart.padRight),
    height: chart.height - chart.padTop - chart.padBottom,
  };
}

/**
 * Catmull-Rom through the samples, converted to cubics, so the shoulders round
 * off instead of coming to a polyline point.
 */
export function smoothPath(points: ChartPoint[]): SkPath {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;
  path.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const previous = points[i - 1] ?? points[i];
    const current = points[i];
    const next = points[i + 1];
    const following = points[i + 2] ?? next;
    path.cubicTo(
      current.x + (next.x - previous.x) / 6,
      current.y + (next.y - previous.y) / 6,
      next.x - (following.x - current.x) / 6,
      next.y - (following.y - current.y) / 6,
      next.x,
      next.y,
    );
  }
  return path;
}

/** The area between a left-to-right line and the plot's baseline. */
export function areaPath(line: SkPath, box: PlotBox): SkPath {
  const path = line.copy();
  const baseline = box.top + box.height;
  path.lineTo(box.left + box.width, baseline);
  path.lineTo(box.left, baseline);
  path.close();
  return path;
}

/**
 * Evenly spaced horizontal guides from the plot's top edge down, stopping one
 * step above the baseline because the x axis already draws that rule.
 */
export function gridPath(box: PlotBox, count: number): SkPath {
  const path = Skia.Path.Make();
  for (let i = 0; i < count; i++) {
    const y = box.top + (box.height * i) / count;
    path.moveTo(box.left, y);
    path.lineTo(box.left + box.width, y);
  }
  return path;
}

/**
 * A y axis up the plot's left edge and an x axis along its baseline, meeting
 * in one rounded corner and running past the plot to `tipTop` / `tipRight`.
 */
export function axesPath(box: PlotBox, tipTop: number, tipRight: number): SkPath {
  const path = Skia.Path.Make();
  const originX = box.left;
  const originY = box.top + box.height;
  path.moveTo(originX, tipTop);
  path.lineTo(originX, originY);
  path.lineTo(tipRight, originY);
  return path;
}
