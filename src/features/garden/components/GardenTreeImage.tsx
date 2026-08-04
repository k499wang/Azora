import { Image } from 'expo-image';
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import type { GardenTreeStage } from '../domain/homeTreeProgress';

const TREE_STAGE_SOURCES: Record<GardenTreeStage, number> = {
  seed: require('../assets/plants/azora-tree-01/seed.png'),
  sprout: require('../assets/plants/azora-tree-01/sprout.png'),
  sapling: require('../assets/plants/azora-tree-01/sapling.png'),
  young: require('../assets/plants/azora-tree-01/young.png'),
  mature: require('../assets/plants/azora-tree-01/mature.png'),
};

interface GardenTreeImageProps {
  stage: GardenTreeStage;
  size: number;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
}

export default function GardenTreeImage({
  stage,
  size,
  accessibilityLabel,
  style,
}: GardenTreeImageProps) {
  return (
    <Image
      source={TREE_STAGE_SOURCES[stage]}
      style={[styles.image, { width: size, height: size }, style]}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={0}
      accessible={accessibilityLabel != null}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel == null ? undefined : 'image'}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
});
