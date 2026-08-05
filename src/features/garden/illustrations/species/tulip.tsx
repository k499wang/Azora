import { Animated } from 'react-native';
import Svg, { G } from 'react-native-svg';
import GrassGround, { GrassGroundRootLip } from '../GrassGround';
import { flowerStageFromGrowth, type FlowerGrowthStage } from '../growth';
import { useSpeciesEntrance } from '../useSpeciesEntrance';
import type { SpeciesRendererProps } from '../flowerSpecies';
import TulipSproutStage from './tulipStages/Sprout';
import TulipBudStage from './tulipStages/Bud';
import TulipOpeningStage from './tulipStages/Opening';
import TulipBloomStage from './tulipStages/Bloom';

const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 200;
const BASE_Y = 145;
const MOUND_RX = 58;
const MOUND_RY = 18;

function TulipStage({ stage }: { stage: FlowerGrowthStage }) {
  switch (stage) {
    case 'sprout':
      return <TulipSproutStage />;
    case 'bud':
      return <TulipBudStage />;
    case 'opening':
      return <TulipOpeningStage />;
    case 'bloom':
      return <TulipBloomStage />;
  }
}

/**
 * Low-poly tulip-garden illustration. Growth selects a complete faceted stage;
 * it never stretches or mathematically rearranges petals.
 */
export function TulipRenderer({ growth, size }: SpeciesRendererProps) {
  const { opacity, scale } = useSpeciesEntrance();
  const stage = flowerStageFromGrowth(growth);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Tulip ${stage} stage`}
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
          <TulipStage stage={stage} />
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
