import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ExploreScreenProps } from '../app/navigation';
import { returnToHome } from '../app/navigation/returnToHome';
import AppTopBar from '../components/common/AppTopBar';
import Icon from '../components/common/icons/Icon';
import BreathingLibrary from '../components/explore/BreathingLibrary';
import ExerciseSearchBar from '../components/explore/ExerciseSearchBar';
import { triggerTapHaptic } from '../native/tapHaptics';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';

export default function ExploreScreen({ navigation }: ExploreScreenProps) {
  const handleBack = () => {
    triggerTapHaptic();
    returnToHome(navigation);
  };

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
          <View style={styles.searchRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to home"
              onPress={handleBack}
              hitSlop={spacing.sm}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
            >
              <Icon
                name="chevron-left"
                size={26}
                color={colors.text.primary}
              />
            </Pressable>
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
  searchRow: {
    paddingTop: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
});
