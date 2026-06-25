import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import type { MindMapScore } from '../../lib/onboardingScores';

interface MindMapRadarProps {
  scores: MindMapScore[];
  targetScores?: MindMapScore[];
  size?: number;
  showValueOnLabel?: boolean;
}

const RINGS = [0.55, 1];

function axisAngle(index: number, total: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / total;
}

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
  size = 420,
  showValueOnLabel = true,
}: MindMapRadarProps) {
  const labelOffset = 20;
  const labelWidth = 84;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 120;
  const total = scores.length;

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
    <View style={{ width: size, height: size - 40, marginTop: -20 }}>
      <Svg width={size} height={size}>
        {ringPolygons.map((points, idx) => (
          <Polygon
            key={`ring-${idx}`}
            points={points}
            fill="none"
            stroke={colors.neutral[400]}
            strokeWidth={2}
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
              strokeWidth={1.25}
            />
          );
        })}
        {targetPoints ? (
          <Polygon
            points={targetPoints}
            fill={colors.orange[300]}
            fillOpacity={0.3}
            stroke={colors.orange[500]}
            strokeWidth={3}
            strokeDasharray="4,4"
          />
        ) : null}
        <Polygon
          points={dataPoints}
          fill={colors.primary.blue300}
          fillOpacity={0.55}
          stroke={colors.primary.blue500}
          strokeWidth={2.5}
        />
        {scores.map((s, i) => {
          const p = pointOnAxis(cx, cy, radius * (s.value / 100), i, total);
          return (
            <Circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={3.5}
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
                  r={4.5}
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
          s.axis === 'breathEase' || s.axis === 'recovery' ? -20 : 0;
        return (
          <View
            key={`label-${s.axis}`}
            pointerEvents="none"
            style={[
              styles.labelWrap,
              { left, top: p.y - 18 + topNudge, width: labelWidth },
            ]}
          >
            <Text style={[styles.labelTitle, { textAlign }]}>{s.label}</Text>
            {showValueOnLabel ? (
              targetScores ? (
                <Text style={[styles.labelValue, { textAlign }]}>
                  {s.value}
                  <Text style={styles.labelValueTarget}> › {targetScores[i]?.value ?? s.value}</Text>
                </Text>
              ) : (
                <Text style={[styles.labelValue, { textAlign }]}>{s.value}%</Text>
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
