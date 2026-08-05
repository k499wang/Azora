import { Animated } from 'react-native';
import Svg, { G } from 'react-native-svg';
import GrassGround, { GrassGroundRootLip } from '../GrassGround';
import { flowerStageFromGrowth, type FlowerGrowthStage } from '../growth';
import { useSpeciesEntrance } from '../useSpeciesEntrance';
import type { SpeciesRendererProps } from '../flowerSpecies';
import RoseSproutStage from './roseStages/Sprout';
import RoseBudStage from './roseStages/Bud';
import RoseOpeningStage from './roseStages/Opening';
import RoseBloomStage from './roseStages/Bloom';

const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 200;
const BASE_Y = 145;
const MOUND_RX = 58;
const MOUND_RY = 18;

function RoseStage({ stage }: { stage: FlowerGrowthStage }) {
  switch (stage) {
    case 'sprout':
      return <RoseSproutStage />;
    case 'bud':
      return <RoseBudStage />;
    case 'opening':
      return <RoseOpeningStage />;
    case 'bloom':
      return <RoseBloomStage />;
  }
}

/**
 * Low-poly rose-garden illustration. Each stage is a complete faceted
 * composition rather than a petal formula, with a soft connected garden base.
 */
export function RoseRenderer({ growth, size }: SpeciesRendererProps) {
  const { opacity, scale } = useSpeciesEntrance();
  const stage = flowerStageFromGrowth(growth);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Rose ${stage} stage`}
      style={{ opacity, transform: [{ scale }] }}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        {/* The mound sits behind the stem so the root visibly enters the grass. */}
        <GrassGround
          cx={VIEWBOX_WIDTH / 2}
          baseY={BASE_Y}
          moundRx={MOUND_RX}
          moundRy={MOUND_RY}
        />
        <G>
          <RoseStage stage={stage} />
        </G>
        <GrassGroundRootLip
          cx={VIEWBOX_WIDTH / 2}
          baseY={BASE_Y}
          moundRx={MOUND_RX}
        />
      </Svg>
    </Animated.View>
  );
}
