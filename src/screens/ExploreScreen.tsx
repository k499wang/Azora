import { ScrollView, StyleSheet, View } from 'react-native';
import type { ExploreScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import BreathingLibrary from '../components/explore/BreathingLibrary';
import ExerciseSearchBar from '../components/explore/ExerciseSearchBar';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';

export default function ExploreScreen({ navigation }: ExploreScreenProps) {
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <AppTopBar showAvatar={false} showStreak={false}>
          <View style={styles.searchWrap}>
            <ExerciseSearchBar
              mode="entry"
              onPress={() => navigation.navigate('ExerciseSearch')}
            />
          </View>
        </AppTopBar>

        <BreathingLibrary />
      </ScrollView>
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
    gap: margin.sectionGap,
  },
  searchWrap: {
    paddingTop: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
  },
});
