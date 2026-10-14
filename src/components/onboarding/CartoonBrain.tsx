import { Circle, ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

/** The brain is drawn in a 200 × 160 box; callers place and scale that box. */
export const CARTOON_BRAIN_WIDTH = 200;
export const CARTOON_BRAIN_HEIGHT = 160;

const CLIP_ID = 'cartoon-brain-silhouette';

/** Paths for the CBT chalkboard's flat cartoon brain. */
export const BRAIN_SHAPE = {
  silhouette:
    'M35 107 C18 105 8 93 10 77 C1 65 10 49 22 45 C20 27 37 15 54 20 C61 4 84 2 97 12 C113 1 135 7 141 18 C163 12 180 22 180 38 C198 41 203 59 193 73 C201 91 188 107 171 108 C163 124 143 126 129 119 C113 134 87 133 75 121 C59 127 42 119 35 107 Z',
  folds: [
    'M56 24 Q69 18 76 28 Q81 36 92 31',
    'M107 19 Q101 34 112 40 Q123 45 131 34',
    'M153 29 Q145 43 157 49 Q168 53 177 46',
    'M26 46 Q34 37 44 44',
    'M92 54 Q100 47 107 55',
    'M158 69 Q173 61 184 73',
    'M162 93 Q155 101 146 97',
  ],
  stem: 'M124 116 Q123 138 131 149 Q134 154 142 150 L147 148 Q137 133 142 116 Z',
  cerebellum: 'M134 108 C135 130 177 136 187 107 Q170 94 150 101 Z',
  cerebellumSeam: 'M142 116 Q161 126 178 115',
  /** the shaded underside, clipped to the silhouette */
  underside: 'M0 93 Q81 141 200 81 V160 H0 Z',
  highlights: 'M35 33 Q41 25 51 28 M66 18 Q77 12 85 18 M150 23 Q161 20 168 29',
};

interface CartoonBrainProps {
  x: number;
  y: number;
  scale: number;
  /** Colour for each internal structure to draw; leave one out to hide it. */
  structures?: {
    basalGanglia?: string;
    amygdala?: string;
    hippocampus?: string;
  };
}

/** Azora's brain: pastel, with a face. Render inside an `Svg`. */
export default function CartoonBrain({ x, y, scale, structures = {} }: CartoonBrainProps) {
  const surface = colors.chalkboard.brainFrontal;
  return (
    <>
      <Defs>
        <ClipPath id={CLIP_ID}>
          <Path d={BRAIN_SHAPE.silhouette} />
        </ClipPath>
      </Defs>
      <G transform={`translate(${x} ${y}) scale(${scale})`}>
        <Path d={BRAIN_SHAPE.stem} fill={surface} />
        <Path d={BRAIN_SHAPE.cerebellum} fill={surface} />
        <Path
          d={BRAIN_SHAPE.cerebellumSeam}
          fill="none"
          stroke={colors.chalkboard.brainFold}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Path d={BRAIN_SHAPE.silhouette} fill={surface} />
        <G clipPath={`url(#${CLIP_ID})`}>
          <Path d={BRAIN_SHAPE.underside} fill={colors.chalkboard.bookSpine} />
          <Path
            d={BRAIN_SHAPE.highlights}
            fill="none"
            stroke={colors.chalkboard.chalk}
            strokeOpacity={0.42}
            strokeWidth={6}
            strokeLinecap="round"
          />
          {BRAIN_SHAPE.folds.map((fold) => (
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
        {structures.basalGanglia ? (
          <Path
            d="M114 55 Q122 45 132 51 Q143 58 135 70 Q128 77 118 71 Q109 66 114 55 Z"
            fill={structures.basalGanglia}
          />
        ) : null}
        {structures.amygdala ? (
          <Circle cx={86} cy={104} r={8.5} fill={structures.amygdala} />
        ) : null}
        {structures.hippocampus ? (
          <Path
            d="M114 105 Q128 122 146 102"
            fill="none"
            stroke={structures.hippocampus}
            strokeWidth={13}
            strokeLinecap="round"
          />
        ) : null}
      </G>
    </>
  );
}
