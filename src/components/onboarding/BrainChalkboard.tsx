import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Text } from '../common/Text';
import ChalkboardScene, { CHALKBOARD_CENTER, CHALKBOARD_SCENE_HEIGHT } from './ChalkboardScene';

const SCENE_WIDTH = 1000;
const BRAIN_WIDTH = 0.48;
const BRAIN_ASPECT = 160 / 200;
const BRAIN_X = CHALKBOARD_CENTER.x - BRAIN_WIDTH / 2;
const BRAIN_Y = CHALKBOARD_CENTER.y - (BRAIN_WIDTH * BRAIN_ASPECT) / 2;
const BRAIN_SCALE = (SCENE_WIDTH * BRAIN_WIDTH) / 200;
const BRAIN_CLIP_ID = 'brain-silhouette';

const SILHOUETTE =
  'M35 107 C18 105 8 93 10 77 C1 65 10 49 22 45 C20 27 37 15 54 20 C61 4 84 2 97 12 C113 1 135 7 141 18 C163 12 180 22 180 38 C198 41 203 59 193 73 C201 91 188 107 171 108 C163 124 143 126 129 119 C113 134 87 133 75 121 C59 127 42 119 35 107 Z';
const FOLDS = [
  'M56 24 Q69 18 76 28 Q81 36 92 31',
  'M107 19 Q101 34 112 40 Q123 45 131 34',
  'M153 29 Q145 43 157 49 Q168 53 177 46',
  'M26 46 Q34 37 44 44',
  'M92 54 Q100 47 107 55',
  'M158 69 Q173 61 184 73',
  'M162 93 Q155 101 146 97',
];

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
        <Defs>
          <ClipPath id={BRAIN_CLIP_ID}>
            <Path d={SILHOUETTE} />
          </ClipPath>
        </Defs>
        <G transform={`translate(${BRAIN_X * SCENE_WIDTH} ${BRAIN_Y * SCENE_WIDTH}) scale(${BRAIN_SCALE})`}>
          <Path
            d="M124 116 Q123 138 131 149 Q134 154 142 150 L147 148 Q137 133 142 116 Z"
            fill={colors.chalkboard.brainFrontal}
          />
          <Path
            d="M134 108 C135 130 177 136 187 107 Q170 94 150 101 Z"
            fill={colors.chalkboard.brainFrontal}
          />
          <Path
            d="M142 116 Q161 126 178 115"
            fill="none"
            stroke={colors.chalkboard.brainFold}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Path d={SILHOUETTE} fill={colors.chalkboard.brainFrontal} />
          <G clipPath={`url(#${BRAIN_CLIP_ID})`}>
            <Path
              d="M0 93 Q81 141 200 81 V160 H0 Z"
              fill={colors.chalkboard.bookSpine}
            />
            <Path
              d="M35 33 Q41 25 51 28 M66 18 Q77 12 85 18 M150 23 Q161 20 168 29"
              fill="none"
              stroke={colors.chalkboard.chalk}
              strokeOpacity={0.42}
              strokeWidth={6}
              strokeLinecap="round"
            />
            {FOLDS.map((fold) => (
              <Path
                key={fold}
                d={fold}
                fill="none"
                stroke={colors.chalkboard.brainFold}
                strokeWidth={4.5}
                strokeLinecap="round"
              />
            ))}
          </G>

          <Ellipse cx={43} cy={70} rx={12} ry={15} fill={colors.chalkboard.chalk} />
          <Ellipse cx={73} cy={70} rx={12} ry={15} fill={colors.chalkboard.chalk} />
          <Ellipse cx={40} cy={72} rx={6} ry={9} fill={colors.chalkboard.slate} />
          <Ellipse cx={70} cy={72} rx={6} ry={9} fill={colors.chalkboard.slate} />
          <Circle cx={42} cy={68} r={2.5} fill={colors.chalkboard.chalk} />
          <Circle cx={72} cy={68} r={2.5} fill={colors.chalkboard.chalk} />
          <Ellipse cx={26} cy={89} rx={8} ry={4} fill={colors.chalkboard.chalk} opacity={0.3} />
          <Ellipse cx={87} cy={89} rx={8} ry={4} fill={colors.chalkboard.chalk} opacity={0.3} />
          <Path
            d="M47 94 Q57 104 67 94"
            fill="none"
            stroke={colors.chalkboard.slate}
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Internal structures are schematic markers, not surface lobes. */}
          <Path
            d="M114 55 Q122 45 132 51 Q143 58 135 70 Q128 77 118 71 Q109 66 114 55 Z"
            fill={colors.chalkboard.brainParietal}
          />
          <Circle cx={86} cy={104} r={8.5} fill={colors.chalkboard.brainOccipital} />
          <Path
            d="M114 105 Q128 122 146 102"
            fill="none"
            stroke={colors.chalkboard.brainTemporal}
            strokeWidth={13}
            strokeLinecap="round"
          />
        </G>

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
          <Text style={[styles.tagLabel, { fontSize: w(0.034), lineHeight: w(0.041) }]}>
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
