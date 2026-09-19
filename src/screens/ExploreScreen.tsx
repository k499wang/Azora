import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { ResetScreenProps } from '../app/navigation';
import CollapsingTitleBar, {
  useCollapsingContentInset,
  useCollapsingTitle,
} from '../components/common/CollapsingTitleBar';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import { Text } from '../components/common/Text';
import MoodGrid from '../components/explore/MoodGrid';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

/** matches Home's glass chip, so the two screens' top rows weigh the same */
const SEARCH_BUTTON_SIZE = 46;

export default function ExploreScreen({ navigation }: ResetScreenProps) {
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: contentInset },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <View style={styles.titleRow}>
          <Text style={styles.largeTitle}>Reset Your Mind</Text>
          <GlassIconButton
            accessibilityLabel="Search resets"
            size={SEARCH_BUTTON_SIZE}
            variant="regular"
            onPress={() => navigation.navigate('ExerciseSearch')}
          >
            <Icon name="search" size={24} color={colors.text.secondary} />
          </GlassIconButton>
        </View>
        <MoodGrid />
      </Animated.ScrollView>

      <CollapsingTitleBar title="Reset Your Mind" scrollY={scrollY} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing['2xl'],
  },
  largeTitle: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
