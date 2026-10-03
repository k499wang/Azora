import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const SPARKS = [
  { angle: -90, size: 7, color: colors.success[500] },
  { angle: -45, size: 5, color: colors.reward.gold },
  { angle: 0, size: 7, color: colors.success[500] },
  { angle: 45, size: 5, color: colors.reward.gold },
  { angle: 90, size: 7, color: colors.success[500] },
  { angle: 135, size: 5, color: colors.reward.gold },
  { angle: 180, size: 7, color: colors.success[500] },
  { angle: 225, size: 5, color: colors.reward.gold },
] as const;

interface Props {
  /** the key's size; sparks fly from its centre, starting at its edge */
  width: number;
  height: number;
  /** 0 is unfired, 1 is spent */
  progress: SharedValue<number>;
}

interface SparkProps {
  angle: number;
  size: number;
  color: string;
  from: number;
  progress: SharedValue<number>;
}

/** A ring of sparks thrown off the edge of a to-do's key as it is ticked. */
export default function CheckBurst({ width, height, progress }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[styles.origin, { left: width / 2, top: height / 2 }]}
    >
      {SPARKS.map((spark) => (
        <Spark
          key={spark.angle}
          {...spark}
          from={Math.max(width, height) / 2}
          progress={progress}
        />
      ))}
    </View>
  );
}

function Spark({ angle, size, color, from, progress }: SparkProps) {
  const radians = (angle * Math.PI) / 180;
  const travel = from * 0.75;
  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const distance = from + travel * t;
    return {
      // Lit on the first frame of the burst, gone by the time it is spent, and
      // never showing at rest on either end.
      opacity: t <= 0 || t >= 1 ? 0 : 1 - t * t,
      transform: [
        { translateX: Math.cos(radians) * distance },
        { translateY: Math.sin(radians) * distance },
        { scale: 1 - 0.6 * t },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  origin: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  spark: {
    position: 'absolute',
  },
});
