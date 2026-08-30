import { Text } from '../common/Text';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import type { MindMapScore } from '../../lib/onboardingScores';
import {
  axisAngle,
  getRadarLayout,
  LABEL_OFFSET,
} from './mindMapRadarLayout';

interface MindMapRadarProps {
  scores: MindMapScore[];
  targetScores?: MindMapScore[];
  /** Values shown in the labels, when they should not track an animating polygon. */
  labelScores?: MindMapScore[];
  size?: number;
  showValueOnLabel?: boolean;
}

const RINGS = [0.55, 1];

function pointOnAxis(
  cx: number,
  cy: number,
  radius: number,
  index: number,
  total: number,
): { x: number; y: number } {
  const angle = axisAngle(index, total);
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

export default function MindMapRadar({
  scores,
  targetScores,
  labelScores,
  size = 420,
  showValueOnLabel = true,
}: MindMapRadarProps) {
  const labels = labelScores ?? scores;
  const total = scores.length;
  const labelOffset = LABEL_OFFSET;
  const {
    radius,
    labelWidth,
    ink,
    textScale,
    boxHeight,
    boxTop,
  } = getRadarLayout(size, total);
  const cx = size / 2;
  const cy = size / 2;
  // Everything drawn on the pentagon thickens with it, so a tablet gets the
  // same picture rather than the same picture in hairlines.
  const ringStroke = 3 * ink;
  const axisStroke = 2 * ink;
  const polygonStroke = 5 * ink;
  const dotRadius = 6 * ink;
  const targetDotRadius = 7 * ink;
  const targetDash = `${8 * ink},${8 * ink}`;
  const labelTitleScale = {
    fontSize: Math.round(14 * textScale),
    lineHeight: Math.round(18 * textScale),
  };
  const labelValueScale = {
    fontSize: Math.round(11 * textScale),
    lineHeight: Math.round(14 * textScale),
  };

  const ringPolygons = RINGS.map((scale) =>
    scores
      .map((_, i) => {
        const p = pointOnAxis(cx, cy, radius * scale, i, total);
        return `${p.x},${p.y}`;
      })
      .join(' '),
  );

  const dataPoints = scores
    .map((s, i) => {
      const p = pointOnAxis(cx, cy, radius * (s.value / 100), i, total);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const targetPoints = targetScores
    ? targetScores
        .map((s, i) => {
          const p = pointOnAxis(cx, cy, radius * (s.value / 100), i, total);
          return `${p.x},${p.y}`;
        })
        .join(' ')
    : null;

  return (
    <View style={{ width: size, height: boxHeight, marginTop: boxTop }}>
      <Svg width={size} height={size}>
        {ringPolygons.map((points, idx) => (
          <Polygon
            key={`ring-${idx}`}
            points={points}
            fill="none"
            stroke={colors.neutral[400]}
            strokeWidth={ringStroke}
            strokeLinejoin="round"
          />
        ))}
        {scores.map((_, i) => {
          const p = pointOnAxis(cx, cy, radius, i, total);
          return (
            <Line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={colors.neutral[400]}
              strokeWidth={axisStroke}
            />
          );
        })}
        {targetPoints ? (
          <Polygon
            points={targetPoints}
            fill={colors.orange[300]}
            fillOpacity={0.3}
            stroke={colors.orange[500]}
            strokeWidth={polygonStroke}
            strokeLinejoin="round"
            strokeDasharray={targetDash}
          />
        ) : null}
        <Polygon
          points={dataPoints}
          fill={colors.primary.blue300}
          fillOpacity={0.55}
          stroke={colors.primary.blue500}
          strokeWidth={polygonStroke}
          strokeLinejoin="round"
        />
        {scores.map((s, i) => {
          const p = pointOnAxis(cx, cy, radius * (s.value / 100), i, total);
          return (
            <Circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={dotRadius}
              fill={colors.primary.blue600}
            />
          );
        })}
        {targetScores
          ? targetScores.map((s, i) => {
              const p = pointOnAxis(cx, cy, radius * (s.value / 100), i, total);
              return (
                <Circle
                  key={`target-dot-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={targetDotRadius}
                  fill={colors.orange[500]}
                />
              );
            })
          : null}
      </Svg>
      {scores.map((s, i) => {
        const p = pointOnAxis(cx, cy, radius + labelOffset, i, total);
        const dx = p.x - cx;
        let left = p.x - labelWidth / 2;
        let textAlign: 'center' | 'left' | 'right' = 'center';
        if (Math.abs(dx) > 8) {
          if (dx > 0) {
            left = p.x;
            textAlign = 'left';
          } else {
            left = p.x - labelWidth;
            textAlign = 'right';
          }
        }
        // Keep labels inside the canvas so the phone edge never clips them.
        left = Math.max(0, Math.min(left, size - labelWidth));
        // Lift the two upper-side labels so they sit clear of the pentagon.
        const topNudge =
          s.axis === 'breathEase' || s.axis === 'recovery'
            ? -Math.round(20 * textScale)
            : 0;
        return (
          <View
            key={`label-${s.axis}`}
            pointerEvents="none"
            style={[
              styles.labelWrap,
              {
                left,
                top: p.y - Math.round(18 * textScale) + topNudge,
                width: labelWidth,
              },
            ]}
          >
            <Text style={[styles.labelTitle, labelTitleScale, { textAlign }]}>
              {s.label}
            </Text>
            {showValueOnLabel ? (
              targetScores ? (
                <Text style={[styles.labelValue, labelValueScale, { textAlign }]}>
                  {labels[i]?.value ?? s.value}
                  <Text style={styles.labelValueTarget}> › {targetScores[i]?.value ?? s.value}</Text>
                </Text>
              ) : (
                <Text style={[styles.labelValue, labelValueScale, { textAlign }]}>
                  {labels[i]?.value ?? s.value}%
                </Text>
              )
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    position: 'absolute',
  },
  labelTitle: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  labelValue: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.tertiary,
  },
  labelValueTarget: {
    color: colors.orange[500],
  },
});
