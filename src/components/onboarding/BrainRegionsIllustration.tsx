import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Text } from '../common/Text';
import CartoonBrain, {
  CARTOON_BRAIN_HEIGHT,
  CARTOON_BRAIN_POINTS,
  CARTOON_BRAIN_WIDTH,
} from './CartoonBrain';

/**
 * Everything is laid out in one 1000-wide scene and scaled as a whole, so the
 * tags, their text and the lines into the brain keep the same relationship on
 * every screen: nothing can drift off its target or out of the frame.
 */
const SCENE_WIDTH = 1000;
const SCENE_HEIGHT = 640;
const ASPECT = SCENE_HEIGHT / SCENE_WIDTH;

const BRAIN_SCALE = 2.6;
const BRAIN_X = (SCENE_WIDTH - CARTOON_BRAIN_WIDTH * BRAIN_SCALE) / 2;
const BRAIN_Y = SCENE_HEIGHT - CARTOON_BRAIN_HEIGHT * BRAIN_SCALE - 10;

function inScene(point: { x: number; y: number }) {
  return { x: BRAIN_X + point.x * BRAIN_SCALE, y: BRAIN_Y + point.y * BRAIN_SCALE };
}

const LIMBIC_COLOR = colors.chalkboard.brainTemporal;
/** blue, so its line and dot stand out against the pink surface they point at */
const CORTEX_COLOR = colors.chalkboard.brainParietal;

const limbicTarget = inScene(CARTOON_BRAIN_POINTS.amygdala);
const cortexTarget = inScene(CARTOON_BRAIN_POINTS.cortex);

const TAG_TOP = 20;
const TAG_WIDTH = 440;
const TAG_HEIGHT = 165;
const TAG_BOTTOM = TAG_TOP + TAG_HEIGHT;

const TAGS = [
  {
    title: 'Limbic brain',
    subtitle: 'The emotional brain.',
    color: LIMBIC_COLOR,
    x: 20,
    target: limbicTarget,
    // Down the left, then in under the smile to the limbic markers.
    connector: `M200 ${TAG_BOTTOM} V420 Q200 ${limbicTarget.y} 264 ${limbicTarget.y} H${limbicTarget.x}`,
  },
  {
    title: 'Neocortex',
    subtitle: 'The rational brain.',
    color: CORTEX_COLOR,
    x: SCENE_WIDTH - 20 - TAG_WIDTH,
    target: cortexTarget,
    // Down the right, then across onto the crown.
    connector: `M760 ${TAG_BOTTOM} V230 Q760 ${cortexTarget.y} 688 ${cortexTarget.y} H${cortexTarget.x}`,
  },
];

interface BrainRegionsIllustrationProps {
  /** the tallest the drawing may be; it narrows to keep this */
  maxHeight: number;
}

export default function BrainRegionsIllustration({ maxHeight }: BrainRegionsIllustrationProps) {
  const [available, setAvailable] = useState(0);
  const width = Math.min(available, maxHeight / ASPECT);
  const s = (units: number) => (units / SCENE_WIDTH) * width;

  return (
    <View
      style={styles.frame}
      onLayout={(event: LayoutChangeEvent) => setAvailable(event.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <View style={{ width, height: width * ASPECT }}>
          <Svg
            width={width}
            height={width * ASPECT}
            viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
            style={StyleSheet.absoluteFill}
          >
            <CartoonBrain
              x={BRAIN_X}
              y={BRAIN_Y}
              scale={BRAIN_SCALE}
              structures={{ amygdala: LIMBIC_COLOR, hippocampus: LIMBIC_COLOR }}
            />
            {TAGS.map((tag) => (
              <Path
                key={`${tag.title}-line`}
                d={tag.connector}
                fill="none"
                stroke={tag.color}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {TAGS.map((tag) => (
              <Circle
                key={`${tag.title}-dot`}
                cx={tag.target.x}
                cy={tag.target.y}
                r={10}
                fill={tag.color}
                stroke={colors.chalkboard.slate}
                strokeWidth={3}
              />
            ))}
          </Svg>

          {TAGS.map((tag) => (
            <View
              key={tag.title}
              style={[
                styles.tag,
                {
                  left: s(tag.x),
                  top: s(TAG_TOP),
                  width: s(TAG_WIDTH),
                  height: s(TAG_HEIGHT),
                  borderRadius: s(24),
                  paddingHorizontal: s(28),
                  backgroundColor: tag.color,
                },
              ]}
            >
              <Text
                style={[styles.title, { fontSize: s(46), lineHeight: s(56) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {tag.title}
              </Text>
              <Text
                style={[styles.subtitle, { fontSize: s(33), lineHeight: s(44) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {tag.subtitle}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignItems: 'center',
  },
  tag: {
    position: 'absolute',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.semibold,
    color: colors.chalkboard.slate,
  },
  subtitle: {
    fontFamily: fonts.semibold,
    color: colors.chalkboard.slate,
    opacity: 0.75,
  },
});
