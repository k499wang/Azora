import { Animated } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
} from 'react-native-svg';
import GrassGround, { GrassGroundRootLip } from '../GrassGround';
import { flowerStageFromGrowth, type FlowerGrowthStage } from '../growth';
import { useSpeciesEntrance } from '../useSpeciesEntrance';
import type { SpeciesRendererProps } from '../flowerSpecies';

const OUTLINE = '#5A4540';
const STEM = '#4F9863';
const STEM_DARK = '#3C7953';
const LEAF = '#74B96C';
const LEAF_LIGHT = '#9BCB83';
const BLUSH = '#F2A4A2';
const FACE = '#4B3835';

const PETAL_PROPS = {
  stroke: OUTLINE,
  strokeWidth: 3.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export type AzoraFlowerShape =
  | 'lotus'
  | 'sakura'
  | 'lavender'
  | 'lily'
  | 'daisy'
  | 'moon'
  | 'ocean'
  | 'mint'
  | 'peony'
  | 'willow'
  | 'star'
  | 'rose'
  | 'dandelion'
  | 'hibiscus'
  | 'bluebell'
  | 'matcha'
  | 'rainbow'
  | 'poppy'
  | 'frost'
  | 'cloud';

type AzoraFlowerDetail =
  | 'sparkles'
  | 'wave'
  | 'dots'
  | 'halo'
  | 'freckles'
  | 'stardust'
  | 'bubbles'
  | 'rays'
  | 'snow'
  | 'none';

type AzoraFace = 'smile' | 'openSmile' | 'softSmile' | 'sleepySmile';

export interface AzoraFlowerDesign {
  id: string;
  name: string;
  shape: AzoraFlowerShape;
  petal: string;
  petalLight: string;
  petalDark: string;
  center: string;
  accent: string;
  detail: AzoraFlowerDetail;
  face: AzoraFace;
  personality: string;
}

/** The 20 original, collectible flower characters in the Azora universe. */
export const AZORA_FLOWER_DESIGNS = [
  { id: 'calmLotus', name: 'Calm Lotus', shape: 'lotus', petal: '#E9B6C7', petalLight: '#F8DDE5', petalDark: '#C985A3', center: '#F4C978', accent: '#A8D8C0', detail: 'wave', face: 'softSmile', personality: 'the serene guide' },
  { id: 'sakuraWhisper', name: 'Sakura Whisper', shape: 'sakura', petal: '#F2B7C6', petalLight: '#FFE3E7', petalDark: '#D886A1', center: '#F4C978', accent: '#C9A4D8', detail: 'sparkles', face: 'smile', personality: 'the gentle listener' },
  { id: 'lavenderDrift', name: 'Lavender Drift', shape: 'lavender', petal: '#AFA4D8', petalLight: '#DCD6F2', petalDark: '#7E72B0', center: '#F3C978', accent: '#A4CBB3', detail: 'halo', face: 'sleepySmile', personality: 'the dreamy float' },
  { id: 'breatheLily', name: 'Breathe Lily', shape: 'lily', petal: '#F5E7C4', petalLight: '#FFF8E8', petalDark: '#D7B982', center: '#E9A45B', accent: '#A7CDB5', detail: 'rays', face: 'softSmile', personality: 'the slow exhale' },
  { id: 'sunshineDaisy', name: 'Sunshine Daisy', shape: 'daisy', petal: '#FFF1AD', petalLight: '#FFF9D9', petalDark: '#E4C66A', center: '#E89A4C', accent: '#A5D3A0', detail: 'sparkles', face: 'openSmile', personality: 'the warm encourager' },
  { id: 'moonflower', name: 'Moonflower', shape: 'moon', petal: '#C6D2E5', petalLight: '#F3F5FA', petalDark: '#899BB8', center: '#E9C978', accent: '#9DB9D5', detail: 'stardust', face: 'sleepySmile', personality: 'the night-time calm' },
  { id: 'oceanBlossom', name: 'Ocean Blossom', shape: 'ocean', petal: '#8FCBD2', petalLight: '#D2F0ED', petalDark: '#4C9DAA', center: '#F0CF7D', accent: '#8CB9D3', detail: 'wave', face: 'softSmile', personality: 'the rolling tide' },
  { id: 'mintBreeze', name: 'Mint Breeze', shape: 'mint', petal: '#A8D8C1', petalLight: '#DDF3E4', petalDark: '#68B496', center: '#F2CD7C', accent: '#9ECED1', detail: 'rays', face: 'smile', personality: 'the fresh reset' },
  { id: 'peonyPeace', name: 'Peony Peace', shape: 'peony', petal: '#E9A8A7', petalLight: '#F8D2CB', petalDark: '#C47782', center: '#F2C66D', accent: '#B9D3B1', detail: 'dots', face: 'softSmile', personality: 'the tender anchor' },
  { id: 'willowWisp', name: 'Willow Wisp', shape: 'willow', petal: '#C3D99D', petalLight: '#EEF3C9', petalDark: '#8EAF71', center: '#EFC978', accent: '#A6C7B0', detail: 'sparkles', face: 'sleepySmile', personality: 'the quiet wanderer' },
  { id: 'starOrchid', name: 'Star Orchid', shape: 'star', petal: '#D5B5D9', petalLight: '#F0DAEE', petalDark: '#A47EB0', center: '#F1C66D', accent: '#A6C9D4', detail: 'stardust', face: 'openSmile', personality: 'the little constellation' },
  { id: 'rosemellow', name: 'Rosemellow', shape: 'rose', petal: '#E7A0A4', petalLight: '#F7D0C9', petalDark: '#BB6D7B', center: '#F0C76D', accent: '#A9CDA2', detail: 'freckles', face: 'smile', personality: 'the soft-hearted friend' },
  { id: 'dandelight', name: 'Dandelight', shape: 'dandelion', petal: '#F7D982', petalLight: '#FFF2B8', petalDark: '#D5A84F', center: '#EFA85B', accent: '#9BCBA4', detail: 'rays', face: 'openSmile', personality: 'the wish keeper' },
  { id: 'coralHibiscus', name: 'Coral Hibiscus', shape: 'hibiscus', petal: '#F19B82', petalLight: '#FFD1BC', petalDark: '#D86D67', center: '#F2C66F', accent: '#98C9B1', detail: 'dots', face: 'smile', personality: 'the bright pulse' },
  { id: 'bluebellDream', name: 'Bluebell Dream', shape: 'bluebell', petal: '#9CB8E1', petalLight: '#D9E4F7', petalDark: '#6684BB', center: '#F2CE81', accent: '#A6C9C0', detail: 'halo', face: 'sleepySmile', personality: 'the floating thought' },
  { id: 'matchaBloom', name: 'Matcha Bloom', shape: 'matcha', petal: '#B9C98D', petalLight: '#E5EBC3', petalDark: '#7D9D6A', center: '#E9BF68', accent: '#D0A98F', detail: 'dots', face: 'softSmile', personality: 'the grounded ritual' },
  { id: 'rainbowPetal', name: 'Rainbow Petal', shape: 'rainbow', petal: '#F3B4A7', petalLight: '#FFE3C7', petalDark: '#D48DA0', center: '#F1C76F', accent: '#A9BBDD', detail: 'sparkles', face: 'openSmile', personality: 'the hopeful collector' },
  { id: 'bubblePoppy', name: 'Bubble Poppy', shape: 'poppy', petal: '#F49B9E', petalLight: '#FFD1D1', petalDark: '#D5687C', center: '#EBC46E', accent: '#A7D0C3', detail: 'bubbles', face: 'smile', personality: 'the buoyant pause' },
  { id: 'frostBloom', name: 'Frost Bloom', shape: 'frost', petal: '#B9D8E4', petalLight: '#E6F4F3', petalDark: '#78AFC5', center: '#F2D184', accent: '#B6B8D8', detail: 'snow', face: 'softSmile', personality: 'the clear morning' },
  { id: 'cloudBloom', name: 'Cloud Bloom', shape: 'cloud', petal: '#D8D1C8', petalLight: '#FAF7F1', petalDark: '#ADA59D', center: '#EBCF88', accent: '#AFCFD0', detail: 'wave', face: 'sleepySmile', personality: 'the soft landing' },
] as const satisfies readonly AzoraFlowerDesign[];

function renderStemAndLeaves() {
  return (
    <G>
      <Path
        d="M96 148 C96 129 98 108 100 88 L108 88 C106 110 106 130 104 148 Z"
        fill={STEM}
        stroke={OUTLINE}
        strokeWidth={3.2}
        strokeLinejoin="round"
      />
      <Path
        d="M101 128 C88 125 78 116 76 105 C88 105 99 111 104 121 C104 115 105 110 107 106"
        fill={LEAF}
        stroke={OUTLINE}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M105 123 C111 109 122 101 134 101 C131 114 120 123 106 128"
        fill={LEAF_LIGHT}
        stroke={OUTLINE}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M91 116 C95 118 99 121 103 126" fill="none" stroke={STEM_DARK} strokeWidth={2} strokeLinecap="round" />
      <Path d="M110 120 C117 115 123 110 129 106" fill="none" stroke={STEM_DARK} strokeWidth={2} strokeLinecap="round" />
    </G>
  );
}

function renderLotus(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 87 C82 89 65 82 58 70 C72 67 87 72 98 81 C86 65 87 48 99 36 C110 49 111 65 102 81 C113 69 129 66 142 72 C135 84 119 90 100 87 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 88 C84 84 76 73 77 57 C89 60 97 69 100 80 C103 66 112 56 125 54 C127 69 118 82 104 88 Z" fill={design.petal} />
      <Path {...PETAL_PROPS} d="M100 86 C93 78 94 66 100 52 C108 66 108 77 103 87 Z" fill={design.petalLight} />
      <Path d="M81 78 Q100 87 119 78" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function renderSakura(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 81 C92 73 80 76 73 83 C69 72 76 63 87 63 C79 54 83 43 94 40 C97 51 103 55 109 43 C118 48 118 59 111 66 C123 63 131 71 128 82 C117 78 108 81 100 81 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 82 C92 75 82 73 76 78 C75 67 83 60 94 63 C89 53 95 46 103 45 C107 55 105 62 114 59 C120 67 116 76 107 80 C116 78 123 83 124 91 C113 92 106 87 100 82 Z" fill={design.petal} />
      <Circle cx={101} cy={78} r={8} fill={design.center} stroke={OUTLINE} strokeWidth={3} />
      <Circle cx={99} cy={76} r={2} fill={design.petalLight} />
    </G>
  );
}

function renderLavender(design: AzoraFlowerDesign) {
  const buds = [
    [87, 78, 9], [94, 67, 10], [101, 55, 10], [109, 67, 10], [116, 78, 9],
    [94, 82, 9], [103, 75, 10], [111, 83, 9],
  ];
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 91 C87 85 83 71 89 59 C94 49 101 39 106 32 C114 44 119 59 115 72 C112 82 107 88 100 91 Z" fill={design.petalDark} />
      {buds.map(([cx, cy, r], index) => (
        <Circle key={`lavender-${index}`} cx={cx} cy={cy} r={r} fill={index % 2 === 0 ? design.petal : design.petalLight} stroke={OUTLINE} strokeWidth={3} />
      ))}
      <Path d="M103 42 C108 51 111 59 109 68" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function renderLily(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 86 C88 87 76 80 70 67 C83 65 91 69 98 76 C91 62 94 47 100 35 C108 47 110 61 103 76 C111 68 121 65 133 68 C126 80 115 87 100 86 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 88 C90 81 86 67 91 53 C97 61 100 68 100 78 C104 65 112 56 122 54 C123 69 115 81 104 87 Z" fill={design.petalLight} />
      <Path d="M100 85 L100 52 M88 76 C92 77 96 80 100 84 M112 77 C108 78 105 81 101 85" fill="none" stroke={design.accent} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={100} cy={84} r={6} fill={design.center} stroke={OUTLINE} strokeWidth={2.5} />
    </G>
  );
}

function renderDaisy(design: AzoraFlowerDesign) {
  const petals = Array.from({ length: 8 }, (_, index) => {
    const angle = index * 45;
    return <Ellipse key={`daisy-${index}`} cx={100} cy={62} rx={14} ry={34} fill={index % 2 ? design.petalLight : design.petal} stroke={OUTLINE} strokeWidth={3.2} transform={`rotate(${angle} 100 78)`} />;
  });
  return <G>{petals}<Circle cx={100} cy={78} r={16} fill={design.center} stroke={OUTLINE} strokeWidth={3.2} /><Circle cx={95} cy={73} r={3} fill={design.petalLight} /></G>;
}

function renderMoon(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 86 C86 84 77 75 79 62 C80 51 88 42 98 38 C94 51 99 61 108 67 C116 72 121 81 118 90 C111 88 106 87 100 86 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 87 C89 80 87 68 91 57 C95 47 101 41 106 37 C111 49 108 62 101 72 C113 68 124 73 128 83 C118 90 108 90 100 87 Z" fill={design.petalLight} />
      <Path d="M96 48 C95 61 100 69 108 75" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={105} cy={82} r={7} fill={design.center} stroke={OUTLINE} strokeWidth={2.5} />
    </G>
  );
}

function renderOcean(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 88 C87 91 70 84 66 72 C78 72 87 75 95 81 C84 70 83 55 92 47 C100 55 103 65 101 75 C108 63 122 57 133 62 C129 75 117 83 105 84 C116 79 129 82 136 91 C123 97 110 94 100 88 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 87 C88 83 82 72 87 61 C96 66 100 74 101 81 C105 70 114 64 124 67 C124 78 116 86 105 89 Z" fill={design.petalLight} />
      <Path d="M77 78 Q88 82 98 87 Q110 92 124 84" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={101} cy={84} r={7} fill={design.center} stroke={OUTLINE} strokeWidth={2.5} />
    </G>
  );
}

function renderMint(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 88 C86 89 76 82 76 72 C76 65 81 60 88 60 C84 51 89 43 98 43 C102 34 113 38 115 47 C125 45 131 53 127 62 C136 65 137 75 130 81 C121 89 111 88 100 88 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 85 C88 87 82 80 84 72 C86 65 92 64 99 68 C94 58 99 50 107 51 C113 52 116 59 113 67 C120 59 129 62 130 70 C131 79 120 85 100 85 Z" fill={design.petalLight} />
      <Path d="M87 73 Q100 78 115 72" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={101} cy={82} r={6} fill={design.center} stroke={OUTLINE} strokeWidth={2.5} />
    </G>
  );
}

function renderPeony(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 91 C84 91 71 83 71 70 C71 60 78 54 87 54 C83 43 91 35 101 39 C108 31 119 38 118 48 C129 46 136 55 130 64 C140 70 136 82 126 87 C118 91 109 91 100 91 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 87 C87 88 79 80 81 70 C83 62 90 59 99 64 C92 53 99 45 107 48 C114 50 115 58 111 67 C119 58 128 61 128 70 C128 79 117 86 100 87 Z" fill={design.petal} />
      <Path {...PETAL_PROPS} d="M100 84 C94 80 95 71 101 68 C108 64 114 70 111 77 C118 74 123 78 122 83 C116 88 106 88 100 84 Z" fill={design.petalLight} />
      <Circle cx={104} cy={79} r={5} fill={design.center} stroke={OUTLINE} strokeWidth={2.5} />
    </G>
  );
}

function renderWillow(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 91 C89 92 80 86 80 77 C80 69 86 64 94 65 C88 56 94 47 102 48 C111 45 118 52 115 61 C125 60 131 68 127 76 C125 85 113 91 100 91 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M101 87 C92 87 86 82 88 75 C90 69 96 68 102 72 C98 63 104 57 111 59 C118 61 119 68 115 74 C123 70 128 75 126 81 C122 87 112 89 101 87 Z" fill={design.petalLight} />
      <Path d="M89 80 Q100 86 116 78" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function renderStar(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 34 L108 57 L133 51 L119 70 L137 87 L113 83 L105 106 L96 84 L72 89 L87 70 L68 53 L93 58 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 41 L106 63 L125 59 L113 73 L127 83 L108 79 L102 98 L95 79 L78 83 L90 70 L77 59 L96 64 Z" fill={design.petalLight} />
      <Circle cx={101} cy={75} r={10} fill={design.center} stroke={OUTLINE} strokeWidth={3} />
    </G>
  );
}

function renderRose(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 91 C84 91 74 82 77 70 C79 61 87 57 95 61 C87 50 94 40 104 43 C114 37 124 45 120 55 C132 55 137 66 129 74 C135 86 118 94 100 91 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 87 C88 87 83 80 87 72 C90 66 97 67 102 72 C96 62 103 55 111 58 C118 60 119 67 115 74 C124 68 131 75 127 82 C122 90 109 90 100 87 Z" fill={design.petal} />
      <Path d="M96 78 C101 69 112 70 113 77 C114 84 103 87 99 81 C96 77 102 73 106 76" fill="none" stroke={design.petalDark} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={104} cy={80} r={4} fill={design.center} />
    </G>
  );
}

function renderDandelion(design: AzoraFlowerDesign) {
  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * 30 * Math.PI) / 180;
    const x1 = 100 + Math.cos(angle) * 10;
    const y1 = 76 + Math.sin(angle) * 10;
    const x2 = 100 + Math.cos(angle) * 38;
    const y2 = 76 + Math.sin(angle) * 38;
    return <Line key={`ray-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={design.petalDark} strokeWidth={7} strokeLinecap="round" />;
  });
  return <G>{rays}<Circle cx={100} cy={76} r={14} fill={design.petalLight} stroke={OUTLINE} strokeWidth={3} /><Circle cx={100} cy={76} r={7} fill={design.center} stroke={OUTLINE} strokeWidth={2.5} /></G>;
}

function renderHibiscus(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 88 C87 92 74 85 76 74 C77 66 83 61 92 62 C86 50 93 41 103 43 C111 33 122 40 120 51 C131 48 137 57 132 66 C140 73 135 84 124 87 C115 90 107 87 100 88 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 85 C91 87 83 81 85 73 C87 66 94 65 101 70 C95 59 101 51 109 53 C116 55 118 62 114 70 C123 62 130 67 129 74 C128 82 115 87 100 85 Z" fill={design.petalLight} />
      <Path d="M108 78 C116 72 122 65 124 57" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={126} cy={55} r={4} fill={design.center} stroke={OUTLINE} strokeWidth={2} />
    </G>
  );
}

function renderBluebell(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 37 C90 38 84 46 86 57 C78 59 74 67 78 75 C83 85 91 91 100 94 C109 91 117 85 122 75 C126 67 122 59 114 57 C116 46 110 38 100 37 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 43 C93 45 91 51 94 61 C87 61 83 67 87 74 C90 80 95 84 100 87 C105 84 110 80 113 74 C117 67 113 61 106 61 C109 51 107 45 100 43 Z" fill={design.petalLight} />
      <Path d="M88 73 Q100 78 112 73" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={96} cy={77} r={3} fill={design.center} />
      <Circle cx={104} cy={77} r={3} fill={design.center} />
    </G>
  );
}

function renderMatcha(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 91 C86 91 75 83 77 70 C78 61 85 56 94 58 C90 48 97 40 106 43 C115 38 124 45 121 55 C132 55 137 65 131 74 C136 84 119 94 100 91 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 86 C88 86 83 79 87 71 C90 65 97 66 102 72 C97 62 104 55 112 59 C119 62 119 69 115 75 C124 70 130 76 127 82 C123 89 110 90 100 86 Z" fill={design.petalLight} />
      <Ellipse cx={104} cy={78} rx={10} ry={6} fill={design.petal} stroke={OUTLINE} strokeWidth={2.5} />
      <Circle cx={104} cy={78} r={4} fill={design.center} />
    </G>
  );
}

function renderRainbow(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 91 C84 90 75 82 77 70 C79 61 87 57 95 62 C89 50 96 41 106 44 C115 38 125 46 121 57 C132 53 139 62 133 72 C140 81 127 91 115 88 C110 93 105 92 100 91 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 86 C89 85 84 79 88 71 C92 64 98 67 102 72 C97 61 104 53 111 58 C117 62 116 68 113 75 C122 68 130 73 128 80 C125 87 112 88 100 86 Z" fill={design.petalLight} />
      <Path d="M91 70 Q100 76 109 70 Q117 65 124 72" fill="none" stroke="#E6A2B6" strokeWidth={3} strokeLinecap="round" />
      <Path d="M91 76 Q100 82 110 76" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={103} cy={80} r={5} fill={design.center} stroke={OUTLINE} strokeWidth={2} />
    </G>
  );
}

function renderPoppy(design: AzoraFlowerDesign) {
  return (
    <G>
      <Circle cx={83} cy={68} r={24} fill={design.petalDark} stroke={OUTLINE} strokeWidth={3.2} />
      <Circle cx={117} cy={68} r={24} fill={design.petalDark} stroke={OUTLINE} strokeWidth={3.2} />
      <Circle cx={91} cy={84} r={22} fill={design.petal} stroke={OUTLINE} strokeWidth={3.2} />
      <Circle cx={109} cy={84} r={22} fill={design.petalLight} stroke={OUTLINE} strokeWidth={3.2} />
      <Circle cx={100} cy={76} r={14} fill={design.center} stroke={OUTLINE} strokeWidth={3} />
      <Circle cx={94} cy={71} r={3} fill={design.petalLight} />
    </G>
  );
}

function renderFrost(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 34 L108 54 L126 45 L119 64 L138 68 L119 77 L130 94 L108 87 L100 106 L92 87 L70 94 L81 77 L62 68 L81 64 L74 45 L92 54 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 43 L105 61 L121 57 L112 70 L125 77 L108 76 L103 94 L96 76 L79 79 L89 69 L78 61 L95 63 Z" fill={design.petalLight} />
      <Circle cx={101} cy={73} r={9} fill={design.center} stroke={OUTLINE} strokeWidth={3} />
      <Path d="M84 56 L91 62 M116 56 L110 63 M84 83 L92 78 M117 83 L110 78" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

function renderCloud(design: AzoraFlowerDesign) {
  return (
    <G>
      <Path {...PETAL_PROPS} d="M100 91 C86 91 73 86 73 76 C73 68 79 63 87 63 C85 53 92 45 101 47 C105 37 117 37 121 48 C132 46 138 55 134 64 C143 68 143 78 136 84 C128 91 114 90 100 91 Z" fill={design.petalDark} />
      <Path {...PETAL_PROPS} d="M100 86 C89 87 81 82 82 75 C83 69 89 66 97 69 C93 59 100 53 107 55 C114 56 116 63 113 70 C121 63 130 67 130 74 C130 82 116 87 100 86 Z" fill={design.petalLight} />
      <Path d="M86 76 Q100 82 116 75" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={103} cy={80} r={5} fill={design.center} stroke={OUTLINE} strokeWidth={2} />
    </G>
  );
}

function renderHead(design: AzoraFlowerDesign) {
  switch (design.shape) {
    case 'lotus': return renderLotus(design);
    case 'sakura': return renderSakura(design);
    case 'lavender': return renderLavender(design);
    case 'lily': return renderLily(design);
    case 'daisy': return renderDaisy(design);
    case 'moon': return renderMoon(design);
    case 'ocean': return renderOcean(design);
    case 'mint': return renderMint(design);
    case 'peony': return renderPeony(design);
    case 'willow': return renderWillow(design);
    case 'star': return renderStar(design);
    case 'rose': return renderRose(design);
    case 'dandelion': return renderDandelion(design);
    case 'hibiscus': return renderHibiscus(design);
    case 'bluebell': return renderBluebell(design);
    case 'matcha': return renderMatcha(design);
    case 'rainbow': return renderRainbow(design);
    case 'poppy': return renderPoppy(design);
    case 'frost': return renderFrost(design);
    case 'cloud': return renderCloud(design);
  }
}

function renderFace(face: AzoraFace) {
  return (
    <G>
      <Circle cx={88} cy={78} r={3.5} fill={FACE} />
      <Circle cx={112} cy={78} r={3.5} fill={FACE} />
      <Ellipse cx={81} cy={87} rx={7} ry={3.2} fill={BLUSH} opacity={0.72} />
      <Ellipse cx={119} cy={87} rx={7} ry={3.2} fill={BLUSH} opacity={0.72} />
      {face === 'openSmile' ? (
        <Ellipse cx={100} cy={88} rx={7} ry={5} fill={FACE} />
      ) : face === 'sleepySmile' ? (
        <Path d="M94 88 Q100 93 106 88" fill="none" stroke={FACE} strokeWidth={3} strokeLinecap="round" />
      ) : face === 'softSmile' ? (
        <Path d="M95 88 Q100 91 105 88" fill="none" stroke={FACE} strokeWidth={2.7} strokeLinecap="round" />
      ) : (
        <Path d="M93 87 Q100 94 107 87" fill="none" stroke={FACE} strokeWidth={3} strokeLinecap="round" />
      )}
    </G>
  );
}

function renderDetail(design: AzoraFlowerDesign) {
  switch (design.detail) {
    case 'sparkles':
      return <G fill={design.accent} stroke={OUTLINE} strokeWidth={1.4}><Path d="M55 43 L58 50 L65 53 L58 56 L55 63 L52 56 L45 53 L52 50 Z" /><Path d="M145 58 L147 63 L152 65 L147 67 L145 72 L143 67 L138 65 L143 63 Z" /></G>;
    case 'wave':
      return <Path d="M53 98 Q63 91 73 98 T93 98 M129 98 Q139 91 149 98" fill="none" stroke={design.accent} strokeWidth={3} strokeLinecap="round" />;
    case 'dots':
      return <G fill={design.accent}><Circle cx={61} cy={56} r={3} /><Circle cx={143} cy={65} r={4} /><Circle cx={54} cy={83} r={2.5} /></G>;
    case 'halo':
      return <Ellipse cx={100} cy={53} rx={48} ry={25} fill="none" stroke={design.accent} strokeWidth={2.5} strokeDasharray="3 7" opacity={0.9} />;
    case 'freckles':
      return <G fill={design.accent}><Circle cx={77} cy={71} r={2.5} /><Circle cx={82} cy={67} r={2} /><Circle cx={123} cy={68} r={2} /><Circle cx={128} cy={72} r={2.5} /></G>;
    case 'stardust':
      return <G fill={design.accent}><Path d="M57 56 l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" /><Circle cx={143} cy={49} r={3} /><Circle cx={148} cy={77} r={2.5} /></G>;
    case 'bubbles':
      return <G fill="none" stroke={design.accent} strokeWidth={2.5}><Circle cx={58} cy={63} r={7} /><Circle cx={145} cy={54} r={5} /><Circle cx={143} cy={91} r={3} /></G>;
    case 'rays':
      return <G stroke={design.accent} strokeWidth={2.5} strokeLinecap="round"><Line x1={61} y1={74} x2={51} y2={69} /><Line x1={139} y1={74} x2={149} y2={69} /><Line x1={71} y1={48} x2={66} y2={39} /><Line x1={129} y1={48} x2={134} y2={39} /></G>;
    case 'snow':
      return <G stroke={design.accent} strokeWidth={2.2} strokeLinecap="round"><Line x1={58} y1={48} x2={58} y2={61} /><Line x1={52} y1={54} x2={64} y2={54} /><Line x1={142} y1={52} x2={142} y2={64} /><Line x1={136} y1={58} x2={148} y2={58} /></G>;
    case 'none':
      return null;
  }
}

function stageScale(stage: FlowerGrowthStage): number {
  switch (stage) {
    case 'sprout': return 0.34;
    case 'bud': return 0.62;
    case 'opening': return 0.84;
    case 'bloom': return 1;
  }
}

export function AzoraFlowerRenderer({
  design,
  growth,
  size,
}: SpeciesRendererProps & { design: AzoraFlowerDesign }) {
  const { opacity, scale } = useSpeciesEntrance();
  const stage = flowerStageFromGrowth(growth);
  const headScale = stageScale(stage);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${design.name} flower`}
      style={{ opacity, transform: [{ scale }] }}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <GrassGround cx={100} baseY={145} moundRx={58} moundRy={18} />
        {renderStemAndLeaves()}
        <G transform={`translate(${100 - 100 * headScale} ${78 - 78 * headScale}) scale(${headScale})`}>
          {renderHead(design)}
          {renderDetail(design)}
          {stage !== 'sprout' ? renderFace(design.face) : null}
        </G>
        <Rect x={96} y={145} width={12} height={4} rx={2} fill={STEM_DARK} opacity={0.5} />
        <GrassGroundRootLip cx={100} baseY={145} moundRx={58} />
      </Svg>
    </Animated.View>
  );
}

export function createAzoraFlowerRenderer(design: AzoraFlowerDesign) {
  return function AzoraFlowerSpeciesRenderer(props: SpeciesRendererProps) {
    return <AzoraFlowerRenderer {...props} design={design} />;
  };
}
