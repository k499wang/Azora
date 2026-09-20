import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { RoutineBrowserScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import ScreenContent from '../components/common/ScreenContent';
import { Text } from '../components/common/Text';
import Icon from '../components/common/icons/Icon';
import { GOAL_SUGGESTION_CATEGORIES } from '../features/selfCare/goalSuggestions';
import { triggerTapHaptic } from '../native/tapHaptics';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { pressable } from '../theme/pressable';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

/** Entry point for choosing a practical, room-based routine. */
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
            <Text style={styles.title}>Choose a category</Text>
          </ScreenContent>
        )}
        renderItem={({ item }) => (
          <ScreenContent width="grouped">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.label} routines`}
              accessibilityHint="Opens this routine category"
              onPress={() => {
                triggerTapHaptic();
                navigation.navigate('RoutineCategory', { categoryId: item.id });
              }}
              style={({ pressed }) => [
                card.base,
                card.shadow,
                styles.category,
                pressed && pressable.surface,
              ]}
            >
              <View style={styles.iconBadge}>
                <Icon name={item.icon} size={32} color={colors.primary.blue500} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
            </Pressable>
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
  category: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconBadge: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  separator: {
    height: spacing.sm,
  },
});
