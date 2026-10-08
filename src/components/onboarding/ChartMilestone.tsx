import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { spring } from '../../theme/motion';
import { chart, chartText } from './chartTokens';
import { popStyle, useChartPop } from './useChartReveal';

interface Props {
  x: number;
  y: number;
  label: string;
  marker: 'ring' | 'end';
  progress: SharedValue<number>;
  revealAt: number;
}

const LABEL_LANE = 140;
const RING = chart.milestone.ringRadius * 2;
const END_ICON = chart.milestone.endIconSize;
const BASELINE_Y = chart.height - chart.padBottom;

/**
 * A stop on the milestone chart: a marker on the line with a drop line to the
 * x axis. A ring's label sits below and left of it, under the falling line and
 * clear of the drop line; the end icon's label sits above, where the line has
 * flattened out. Each pops in as the pen passes it. The end of the
 * line takes an icon instead of a ring and lands with a bigger bounce.
 */
export default function ChartMilestone({ x, y, label, marker, progress, revealAt }: Props) {
  const isEnd = marker === 'end';
  const markerSize = isEnd ? END_ICON : RING;
  const shown = useChartPop(progress, revealAt, isEnd ? spring.bounce : spring.pop);
  const pop = useAnimatedStyle(() => popStyle(shown.value));
  const fade = useAnimatedStyle(() => ({ opacity: Math.min(1, shown.value) }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.drop,
          { left: x - chart.milestone.dropWidth / 2, top: y, height: BASELINE_Y - y },
          fade,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          isEnd ? styles.labelAbove : styles.labelBelowLeft,
          isEnd
            ? { left: x - LABEL_LANE / 2, bottom: chart.height - y + markerSize / 2 + spacing.xs }
            : { left: x - markerSize / 2 - spacing.sm - LABEL_LANE, top: y + spacing.xs },
          pop,
        ]}
      >
        <Text style={chartText.milestone}>{label}</Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.marker,
          { left: x - markerSize / 2, top: y - markerSize / 2, width: markerSize, height: markerSize },
          pop,
        ]}
      >
        {isEnd ? (
          <Icon
            name="heart-bold"
            size={END_ICON}
            color={chart.milestone.endIconColor}
          />
        ) : (
          <View style={styles.ring} />
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  drop: {
    position: 'absolute',
    width: chart.milestone.dropWidth,
    backgroundColor: chart.milestone.dropColor,
  },
  labelAbove: {
    position: 'absolute',
    width: LABEL_LANE,
    alignItems: 'center',
  },
  labelBelowLeft: {
    position: 'absolute',
    width: LABEL_LANE,
    alignItems: 'flex-end',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: radius.full,
    borderWidth: chart.milestone.ringWidth,
    borderColor: chart.milestone.lineColor,
    backgroundColor: chart.milestone.ringFill,
  },
});
