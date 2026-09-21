import { FlatList, StyleSheet, View } from 'react-native';
import type { RoutineBrowserScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import ScreenContent from '../components/common/ScreenContent';
import { Text } from '../components/common/Text';
import RoutineCategoryCard from '../features/selfCare/RoutineCategoryCard';
import { GOAL_SUGGESTION_CATEGORIES } from '../features/selfCare/goalSuggestions';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

/** Entry point for choosing supportive routines by the need they address. */
export default function RoutineBrowserScreen({ navigation }: RoutineBrowserScreenProps) {
  return (
    <View style={styles.screen}>
      <AppTopBar
        title="Browse routines"
        showBack
        showAvatar={false}
        showStreak={false}
      />
      <FlatList
        data={GOAL_SUGGESTION_CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <ScreenContent width="grouped">
            <Text style={styles.title}>What would support you today?</Text>
          </ScreenContent>
        )}
        renderItem={({ item }) => (
          <ScreenContent width="grouped">
            <RoutineCategoryCard category={item} variant="row" onPress={() => navigation.navigate('RoutineCategory', { categoryId: item.id })} />
          </ScreenContent>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingTop: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing['7xl'],
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    paddingBottom: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
});
