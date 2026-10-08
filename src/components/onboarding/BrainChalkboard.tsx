import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Text } from '../common/Text';
import ChalkboardScene, { CHALKBOARD_CENTER } from './ChalkboardScene';

/**
 * A cartoon brain on the chalkboard, side on and facing left, with tags naming
 * the regions a daily routine leans on. It is one brain-shaped outline with
 * the four lobes painted inside it (each lobe is drawn generously and clipped
 * to the outline, so their shared edges are the sulci), drawn in a 200 × 160
 * box. Tags are placed in scene-width fractions like the board.
 */

const BRAIN_VIEW_BOX = '0 0 200 160';
const BRAIN_ASPECT = 160 / 200;
const BRAIN_WIDTH = 0.48;
/** centred on the slate; the tags may overhang the frame, the brain may not move off centre */
const BRAIN_X = CHALKBOARD_CENTER.x - BRAIN_WIDTH / 2;
const BRAIN_Y = CHALKBOARD_CENTER.y - (BRAIN_WIDTH * BRAIN_ASPECT) / 2;
const BRAIN_CLIP_ID = 'brain-silhouette';

const SILHOUETTE =
  'M52 100 C30 104 10 94 8 72 C6 40 34 14 74 9 C100 4 140 6 164 18 C188 30 198 52 194 74 C192 92 180 102 164 104 C150 106 140 114 130 120 C112 128 82 128 66 118 C58 112 54 106 52 100 Z';
const LOBES = [
  {
    fill: colors.chalkboard.brainFrontal,
    d: 'M0 0 H118 C112 30 100 50 94 76 C78 82 64 92 52 102 L0 160 Z',
    folds: [
      'M24 54 c6 -8 14 -8 20 0 s14 8 20 0',
      'M44 30 c8 -6 18 -6 26 0',
      'M20 80 c8 6 18 6 26 -2',
      'M56 66 c6 -6 14 -6 20 0',
    ],
  },
  {
    fill: colors.chalkboard.brainParietal,
    d: 'M118 0 H180 L174 22 C168 44 166 64 160 86 C140 80 118 76 94 76 C100 50 112 30 118 0 Z',
    folds: [
      'M124 26 c6 -6 14 -6 20 0 s12 6 18 0',
      'M116 56 c8 -6 16 -6 24 0 s10 6 16 2',
    ],
  },
  {
    fill: colors.chalkboard.brainOccipital,
    d: 'M180 0 H200 V160 H166 C166 130 164 100 160 86 C166 64 168 44 174 22 Z',
    folds: [
      'M178 42 c4 6 6 12 6 20',
      'M170 86 c6 -4 12 -2 16 2',
    ],
  },
  {
    fill: colors.chalkboard.brainTemporal,
    d: 'M52 102 C64 92 78 82 94 76 C118 76 140 80 160 86 C163 94 165 100 166 106 L166 160 H40 Z',
    folds: [
      'M74 98 c8 -6 18 -6 26 0 s18 6 26 0',
      'M96 112 c8 4 18 4 26 -2',
    ],
  },
];
/** central sulcus, lateral fissure, parieto-occipital sulcus — the lobes' shared edges */
const SULCI = [
  'M118 0 C112 30 100 50 94 76',
  'M52 102 C64 92 78 82 94 76 C118 76 140 80 160 86',
  'M180 0 L174 22 C168 44 166 64 160 86',
];
const CEREBELLUM = 'M132 110 C134 132 178 134 188 102 C178 94 146 96 132 110 Z';
const CEREBELLUM_FOLDS = [
  'M140 110 q22 8 44 -4',
  'M144 120 q18 6 34 -4',
];
const STEM = 'M124 118 C126 132 128 140 131 150 L142 150 C140 140 139 130 141 118 Z';

type TailSide = 'up' | 'down' | 'left' | 'right';

interface RegionTag {
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  tail: TailSide;
  /** where along its edge the tail sits, 0–1 */
  tailAt: number;
}

const TAGS: RegionTag[] = [
  { label: 'Prefrontal\ncortex', color: colors.chalkboard.brainFrontal, x: 0.03, y: 0.12, width: 0.19, tail: 'right', tailAt: 0.5 },
  { label: 'Basal ganglia', color: colors.chalkboard.brainParietal, x: 0.68, y: 0.035, width: 0.29, tail: 'down', tailAt: 0.15 },
  { label: 'Amygdala', color: colors.chalkboard.brainOccipital, x: 0.78, y: 0.22, width: 0.2, tail: 'left', tailAt: 0.5 },
  { label: 'Hippocampus', color: colors.chalkboard.brainTemporal, x: 0.04, y: 0.44, width: 0.26, tail: 'up', tailAt: 0.85 },
];

const TAG_TEXT = 0.034;
const TAG_RADIUS = 0.02;
const TAG_PAD = 0.015;
const TAIL = 0.026;
const FOLD_WIDTH = 3.5;
const SULCUS_WIDTH = 4;

interface BrainChalkboardProps {
  width: number;
  active?: boolean;
}

export default function BrainChalkboard({ width, active = true }: BrainChalkboardProps) {
  const w = (fraction: number) => fraction * width;
  const brainWidth = w(BRAIN_WIDTH);
  const tail = w(TAIL);

  return (
    <ChalkboardScene width={width} active={active}>
      <Svg
        width={brainWidth}
        height={brainWidth * BRAIN_ASPECT}
        viewBox={BRAIN_VIEW_BOX}
        style={[styles.brain, { left: w(BRAIN_X), top: w(BRAIN_Y) }]}
      >
        <Defs>
          <ClipPath id={BRAIN_CLIP_ID}>
            <Path d={SILHOUETTE} />
          </ClipPath>
        </Defs>
        <Path d={STEM} fill={colors.chalkboard.brainStem} />
        <Path d={CEREBELLUM} fill={colors.chalkboard.brainCerebellum} />
        {CEREBELLUM_FOLDS.map((fold) => (
          <Fold key={fold} d={fold} />
        ))}
        <G clipPath={`url(#${BRAIN_CLIP_ID})`}>
          {LOBES.map((lobe) => (
            <Path key={lobe.d} d={lobe.d} fill={lobe.fill} />
          ))}
          {SULCI.map((sulcus) => (
            <Fold key={sulcus} d={sulcus} width={SULCUS_WIDTH} />
          ))}
          {LOBES.flatMap((lobe) => lobe.folds).map((fold) => (
            <Fold key={fold} d={fold} />
          ))}
        </G>
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
              padding: w(TAG_PAD),
              borderRadius: w(TAG_RADIUS),
              backgroundColor: tag.color,
            },
          ]}
        >
          <View
            style={[
              styles.tail,
              { width: tail, height: tail, backgroundColor: tag.color },
              tailPosition(tag, tail, w(tag.width)),
            ]}
          />
          <Text
            style={[
              styles.tagLabel,
              { fontSize: w(TAG_TEXT), lineHeight: w(TAG_TEXT * 1.25) },
            ]}
          >
            {tag.label}
          </Text>
        </View>
      ))}
    </ChalkboardScene>
  );
}

function Fold({ d, width = FOLD_WIDTH }: { d: string; width?: number }) {
  return (
    <Path
      d={d}
      fill="none"
      stroke={colors.chalkboard.brainFold}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

/** a square turned 45° and half tucked under the tag, so one corner pokes out */
function tailPosition(tag: RegionTag, tail: number, tagWidth: number) {
  if (tag.tail === 'left' || tag.tail === 'right') {
    const edge = tag.tail === 'left' ? { left: -tail / 2 } : { right: -tail / 2 };
    return { ...edge, top: `${tag.tailAt * 100}%` as const, marginTop: -tail / 2 };
  }
  const left = tag.tailAt * tagWidth - tail / 2;
  return tag.tail === 'up' ? { left, top: -tail / 2 } : { left, bottom: -tail / 2 };
}

const styles = StyleSheet.create({
  brain: {
    position: 'absolute',
  },
  tag: {
    position: 'absolute',
    alignItems: 'center',
  },
  tail: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  tagLabel: {
    fontFamily: fonts.semibold,
    color: colors.chalkboard.slate,
    textAlign: 'center',
  },
});
