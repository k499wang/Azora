import {
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import type { HomeTreeProgress } from '../domain/homeTreeProgress';
import FlowerIllustration from '../illustrations/FlowerIllustration';

const TREE_SCALE = 1;

interface HomeTreeHeroProps {
  progress: HomeTreeProgress | null;
  progressUnavailable?: boolean;
}

export default function HomeTreeHero({
  progress,
  progressUnavailable = false,
}: HomeTreeHeroProps) {
  // TEMP preview: showing the fully grown tulip in the circle. Revert to the
  // rose with growth derived from flowerGrowthFromCareDays(progress.careDays).
  const { width } = useWindowDimensions();
  const size = Math.min(300, width - spacing.lg * 2 - spacing.xl);
  const treeSize = Math.round(size * TREE_SCALE);
  const unavailable = progress == null && progressUnavailable;

  return (
    <View
      accessibilityLiveRegion={progress == null ? 'polite' : 'none'}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {progress == null ? (
        <ActivityIndicator
          color={unavailable ? colors.neutral[400] : colors.playful.teal.base}
        />
      ) : (
        <FlowerIllustration speciesId="tulip" growth={1} size={treeSize} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,229,218,0.40)',
    borderWidth: 3,
    borderColor: 'rgba(0,163,145,0.30)',
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
