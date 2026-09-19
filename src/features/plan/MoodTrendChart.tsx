/**
 * Thirty days of mood, drawn the way the heart screen draws a session.
 *
 * Same language on purpose: dashed grid, a soft triple-stroke line, a dot on
 * the most recent reading. A second chart idiom in one app is two apps.
 *
 * The line breaks over days that were never answered rather than carrying the
 * last value across them. A straight line through an unanswered fortnight is
 * the chart inventing a calm one, and it would be the most reassuring thing on
 * the page.
 */
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import Icon from '../../components/common/icons/Icon';
import {
  MOOD_FACES,
  MOOD_SCALE_MAX,
  MOOD_SCALE_MIN,
} from '../mood/domain/moodCheckIn';
import { MOOD_FACE_HUE } from '../mood/moodFaceHue';
import {
  moodTrendSegments,
  type MoodTrendPoint,
} from './domain/moodAnalytics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const HEIGHT = 132;
const PADDING = { top: 12, right: 6, bottom: 10, left: 6 };
const LINE_COLOR = colors.playful.sky.base;
/**
 * Worst, middle, best — as the faces they were answered with.
 *
 * Numbers on this axis meant nothing: a 3.6 is not a thing anybody can
 * picture, and the check-in never asked in numbers. The faces are the scale
 * the user already knows, so the line reads without a legend.
 */
const Y_TICKS = [MOOD_SCALE_MAX, 3, MOOD_SCALE_MIN] as const;
/** Big enough to read as an expression rather than a grey smudge. */
const TICK_FACE = 26;
const POINT_RADIUS = 2.5;

interface MoodTrendChartProps {
  points: MoodTrendPoint[];
}

export default function MoodTrendChart({ points }: MoodTrendChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const innerWidth = Math.max(width - PADDING.left - PADDING.right, 0);
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const x = (index: number) => PADDING.left + index * step;
  const y = (value: number) =>
    PADDING.top +
    innerHeight *
      (1 -
        (value - MOOD_SCALE_MIN) / (MOOD_SCALE_MAX - MOOD_SCALE_MIN));

  const segments = moodTrendSegments(points);
  const paths = segments.map((indices) =>
    indices
      .map(
        (index, position) =>
          `${position === 0 ? 'M' : 'L'}${x(index)} ${y(
            points[index].value as number,
          )}`,
      )
      .join(' '),
  );
  const lastIndex = segments.at(-1)?.at(-1);
  const last =
    lastIndex == null
      ? null
      : { x: x(lastIndex), y: y(points[lastIndex].value as number) };

  return (
    <View style={styles.chart}>
      <View style={styles.axis}>
        {Y_TICKS.map((tick) => (
          <Icon
            key={tick}
            name={MOOD_FACES[tick - 1]}
            size={TICK_FACE}
            color={MOOD_FACE_HUE[tick].bare}
          />
        ))}
      </View>

      <View style={styles.plot} onLayout={onLayout}>
        {width === 0 ? null : (
          <Svg width={width} height={HEIGHT}>
            {Y_TICKS.map((tick) => (
              <Line
                key={`grid-${tick}`}
                x1={PADDING.left}
                y1={y(tick)}
                x2={width - PADDING.right}
                y2={y(tick)}
                stroke={colors.neutral[200]}
                strokeWidth={1}
                strokeDasharray="3,4"
              />
            ))}

            {/* Days with nothing between them are still joined, but by a
                dashed thread rather than the line: the shape stays readable
                and the chart never claims a reading it does not have. */}
            {segments.slice(0, -1).map((indices, index) => {
              const from = indices.at(-1) as number;
              const to = segments[index + 1][0];

              return (
                <Line
                  key={`bridge-${from}`}
                  x1={x(from)}
                  y1={y(points[from].value as number)}
                  x2={x(to)}
                  y2={y(points[to].value as number)}
                  stroke={LINE_COLOR}
                  strokeWidth={2}
                  strokeDasharray="2,4"
                  strokeLinecap="round"
                  opacity={0.45}
                />
              );
            })}

            {/* Two soft passes under the stroke, so the line reads as lit
                rather than drawn on. The same three widths the BPM chart
                uses. */}
            {paths.map((path, index) => (
              <Path
                key={`glow-${index}`}
                d={path}
                stroke={LINE_COLOR}
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.04}
              />
            ))}
            {paths.map((path, index) => (
              <Path
                key={`halo-${index}`}
                d={path}
                stroke={LINE_COLOR}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.09}
              />
            ))}
            {paths.map((path, index) => (
              <Path
                key={`line-${index}`}
                d={path}
                stroke={LINE_COLOR}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Every answered day is marked, so the line reads as a run of
                readings rather than as a drawn shape. */}
            {points.map((point, index) =>
              point.value == null ? null : (
                <Circle
                  key={`point-${point.localDate}`}
                  cx={x(index)}
                  cy={y(point.value)}
                  r={POINT_RADIUS}
                  fill={LINE_COLOR}
                />
              ),
            )}

            {last == null ? null : (
              <>
                <Circle
                  cx={last.x}
                  cy={last.y}
                  r={6}
                  fill={LINE_COLOR}
                  opacity={0.18}
                />
                <Circle cx={last.x} cy={last.y} r={3} fill={LINE_COLOR} />
              </>
            )}
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  // Each face is centred on the gridline it labels, so the axis lines up
  // with the plot rather than merely sitting beside it.
  axis: {
    height: HEIGHT,
    paddingTop: PADDING.top - TICK_FACE / 2,
    paddingBottom: PADDING.bottom - TICK_FACE / 2,
    justifyContent: 'space-between',
  },
  plot: {
    flex: 1,
    height: HEIGHT,
  },
});
