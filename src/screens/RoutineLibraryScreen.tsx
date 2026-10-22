import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ExploreScreenProps } from '../app/navigation';
import CollapsingTitleBar, { useCollapsingContentInset, useCollapsingTitle } from '../components/common/CollapsingTitleBar';
import TabTitleRow from '../components/common/TabTitleRow';
import ExploreActionCard from '../components/explore/ExploreActionCard';
import ScreenContent from '../components/common/ScreenContent';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import { useTourTarget } from '../features/tour/tourTargets';

const TAB_BAR_HEIGHT = 49;

export default function RoutineLibraryScreen({ navigation }: ExploreScreenProps) {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const azoToolkitTarget = useTourTarget('azoToolkit');

  return <View style={styles.screen}>
    <Animated.ScrollView contentContainerStyle={[styles.content, { paddingTop: contentInset, paddingBottom: tabBarHeight + spacing.xl }]} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      <ScreenContent width="grouped">
        <TabTitleRow title="Explore" />
      </ScreenContent>
      <ScreenContent width="grouped" style={styles.grid}>
        <View {...azoToolkitTarget} style={styles.tile}>
          <ExploreActionCard
            title="AI Cleaning Helper"
            subtitle="Help with your space"
            hue={colors.playful.violet}
            illustration="camera"
            accessibilityLabel="AI Cleaning Helper"
            accessibilityHint="Opens Azo’s photo helper"
            onPress={() => navigation.navigate('PhotoCleanup')}
          />
        </View>
        <View style={styles.tile}>
          <ExploreActionCard
            title="Focus Timer"
            subtitle="Make time for one thing."
            hue={colors.playful.sky}
            illustration="timer"
            accessibilityLabel="Focus Timer"
            accessibilityHint="Opens a standalone focus timer"
            onPress={() => navigation.navigate('FocusTimer')}
          />
        </View>
        <View style={styles.tile}>
          <ExploreActionCard
            title="Breathing"
            subtitle="Find your calm"
            hue={colors.playful.sky}
            illustration="lotus"
            accessibilityLabel="Breathing exercises"
            accessibilityHint="Opens the breathing exercise library"
            onPress={() => navigation.navigate('ExerciseSearch', { browse: true })}
          />
        </View>
        <View style={styles.tile}>
          <ExploreActionCard
            title="Routines"
            subtitle="Make time for yourself"
            hue={colors.playful.teal}
            illustration="calendar-check-outline"
            accessibilityLabel="Routines"
            accessibilityHint="Opens the routine library"
            onPress={() => navigation.navigate('RoutineBrowser')}
          />
        </View>
        <View style={styles.tile}>
          <ExploreActionCard
            title="Heart Rate"
            subtitle="Check in on your heart"
            hue={colors.playful.coral}
            illustration="heart"
            accessibilityLabel="Heart Rate"
            accessibilityHint="Opens your heart statistics"
            onPress={() => navigation.navigate('Heart')}
          />
        </View>
      </ScreenContent>
    </Animated.ScrollView>
    <CollapsingTitleBar title="Explore" scrollY={scrollY} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  content: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
  },
  tile: { width: '48%' },
});
