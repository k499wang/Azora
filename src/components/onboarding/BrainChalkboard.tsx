import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Text } from '../common/Text';
import CartoonBrain, { CARTOON_BRAIN_WIDTH } from './CartoonBrain';
import ChalkboardScene, { CHALKBOARD_CENTER, CHALKBOARD_SCENE_HEIGHT } from './ChalkboardScene';

const SCENE_WIDTH = 1000;
const BRAIN_WIDTH = 0.48;
const BRAIN_ASPECT = 160 / 200;
const BRAIN_X = CHALKBOARD_CENTER.x - BRAIN_WIDTH / 2;
const BRAIN_Y = CHALKBOARD_CENTER.y - (BRAIN_WIDTH * BRAIN_ASPECT) / 2;
const BRAIN_SCALE = (SCENE_WIDTH * BRAIN_WIDTH) / CARTOON_BRAIN_WIDTH;

interface RegionTag {
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  target: { x: number; y: number };
  /** Connector waypoints share the scene coordinate system with the tag. */
  connector: string;
}

const TAGS: RegionTag[] = [
  {
    label: 'Prefrontal\ncortex',
    color: colors.chalkboard.brainFrontal,
    x: 0.075,
    y: 0.085,
    width: 0.22,
    height: 0.097,
    target: { x: 38, y: 36 },
    connector: 'M295 133.5 H311 Q321 133.5 321 143.5 V194.4 H351.2',
  },
  {
    label: 'Basal ganglia',
    color: colors.chalkboard.brainParietal,
    x: 0.65,
    y: 0.068,
    width: 0.275,
    height: 0.064,
    target: { x: 125, y: 62 },
    connector: 'M650 100 H592 Q560 100 560 132 V256.8',
  },
  {
    label: 'Amygdala',
    color: colors.chalkboard.brainOccipital,
    x: 0.74,
    y: 0.257,
    width: 0.2,
    height: 0.064,
    target: { x: 86, y: 104 },
    connector: 'M740 289 H736 Q730 289 730 295 V311 Q730 329 712 329 H484.4 Q466.4 329 466.4 347 V357.6',
  },
  {
    label: 'Hippocampus',
    color: colors.chalkboard.brainTemporal,
    x: 0.075,
    y: 0.445,
    width: 0.265,
    height: 0.064,
    target: { x: 132, y: 108 },
    connector: 'M300 445 V431 Q300 414 317 414 H559.8 Q576.8 414 576.8 397 V367.2',
  },
];

interface BrainChalkboardProps {
  width: number;
  active?: boolean;
}

export default function BrainChalkboard({ width, active = true }: BrainChalkboardProps) {
  const w = (fraction: number) => fraction * width;

  return (
    <ChalkboardScene width={width} active={active}>
      <Svg
        width={width}
        height={w(CHALKBOARD_SCENE_HEIGHT)}
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_WIDTH * CHALKBOARD_SCENE_HEIGHT}`}
        style={StyleSheet.absoluteFill}
      >
        <CartoonBrain
          x={BRAIN_X * SCENE_WIDTH}
          y={BRAIN_Y * SCENE_WIDTH}
          scale={BRAIN_SCALE}
          structures={{
            basalGanglia: colors.chalkboard.brainParietal,
            amygdala: colors.chalkboard.brainOccipital,
            hippocampus: colors.chalkboard.brainTemporal,
          }}
        />

        {TAGS.map((tag) => (
          <G key={tag.label}>
            <Path
              d={tag.connector}
              fill="none"
              stroke={tag.color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={(BRAIN_X * SCENE_WIDTH) + tag.target.x * BRAIN_SCALE}
              cy={(BRAIN_Y * SCENE_WIDTH) + tag.target.y * BRAIN_SCALE}
              r={5.5}
              fill={tag.color}
              stroke={colors.chalkboard.slate}
              strokeWidth={2}
            />
          </G>
        ))}
      </Svg>

      {TAGS.map((tag) => (
        <View
          key={tag.label}
          style={[
            styles.tag,
            {
              left: w(tag.x),
              top: w(tag.y),
              width: w(tag.width),
              height: w(tag.height),
              borderRadius: w(0.02),
              backgroundColor: tag.color,
            },
          ]}
        >
          <Text
            style={[styles.tagLabel, { fontSize: w(0.034), lineHeight: w(0.041) }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {tag.label}
          </Text>
        </View>
      ))}
    </ChalkboardScene>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    fontFamily: fonts.semibold,
    color: colors.chalkboard.slate,
    textAlign: 'center',
  },
});
