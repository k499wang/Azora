import { Skia } from '@shopify/react-native-skia';
import { chart } from './chartTokens';

/** A symmetric arrowhead centered on the curve's tangent. */
export function createChartArrow(x: number, y: number, angle: number) {
  'worklet';
  const path = Skia.Path.Make();
  const length = chart.lineWidth * 2;
  const halfWidth = chart.lineWidth * 2;
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  const baseX = x - length * directionX;
  const baseY = y - length * directionY;
  // Extend past the rounded line cap so it cannot blunt the arrow tip.
  path.moveTo(x + chart.lineWidth * directionX, y + chart.lineWidth * directionY);
  path.lineTo(baseX - halfWidth * directionY, baseY + halfWidth * directionX);
  path.lineTo(baseX + halfWidth * directionY, baseY - halfWidth * directionX);
  path.close();
  return path;
}
