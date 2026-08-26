import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GardenScreenProps } from '../app/navigation';
import GlassIconButton from '../components/common/GlassIconButton';
import { Text } from '../components/common/Text';
import GardenTreeImage from '../features/garden/components/GardenTreeImage';
import { buildHomeTreeProgress } from '../features/garden/domain/homeTreeProgress';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useAuthStore } from '../stores/authStore';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

export default function GardenScreen({ navigation }: GardenScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const profileSummaryQuery = useProfileSummaryQuery(userId);
  const summary = profileSummaryQuery.data;
  const careDaysAvailable =
    summary != null && !summary.partialErrors.activeDays;
  const progress = careDaysAvailable
    ? buildHomeTreeProgress(summary.activeDays)
    : null;
  const treeSize = Math.min(
    width - padding.screen.horizontal * 2 - spacing.lg * 2,
    360,
  );

  const nextStageCopy = progress?.nextStageLabel == null
    ? 'Your tree has reached its mature stage.'
    : `${progress.careDaysUntilNextStage} more care ${progress.careDaysUntilNextStage === 1 ? 'day' : 'days'} until ${progress.nextStageLabel}.`;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <GlassIconButton
            accessibilityLabel="Go back"
            size={48}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text.secondary}
            />
          </GlassIconButton>
          <Text style={styles.headerTitle}>My Tree</Text>
          <View style={styles.headerSpacer} />
        </View>

        {progress == null ? (
          <View style={styles.loadingCard} accessibilityLiveRegion="polite">
            {profileSummaryQuery.isPending ? (
              <>
                <ActivityIndicator color={colors.playful.teal.base} />
                <Text style={styles.loadingText}>Loading your tree…</Text>
              </>
            ) : (
              <>
                <Text style={styles.errorTitle}>Your practice is still available</Text>
                <Text style={styles.errorCopy}>
                  We couldn’t refresh your tree just now.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void profileSummaryQuery.refetch()}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.retryButtonPressed,
                  ]}
                >
                  <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <>
            <View style={styles.treeShadow}>
              <LinearGradient
                colors={[colors.background.paper, colors.playful.teal.soft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.treeCard}
              >
                <Text style={styles.eyebrow}>YOUR AZORA TREE</Text>
                <Text style={styles.stageTitle}>{progress.stageLabel}</Text>
                <GardenTreeImage
                  stage={progress.stage}
                  size={treeSize}
                  accessibilityLabel={`${progress.stageLabel} Azora tree`}
                />
                <Text style={styles.careDays}>
                  {progress.careDays} care {progress.careDays === 1 ? 'day' : 'days'}
                </Text>
                <View
                  accessible
                  accessibilityRole="progressbar"
                  accessibilityLabel="Tree stage progress"
                  accessibilityValue={{
                    min: progress.stageStartsAtCareDays,
                    max: progress.nextStageStartsAtCareDays ?? progress.careDays,
                    now: progress.careDays,
                    text: nextStageCopy,
                  }}
                  style={styles.progressGroup}
                >
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.round(progress.stageProgress * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressCopy}>{nextStageCopy}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>How your tree grows</Text>
              <Text style={styles.infoCopy}>
                The first qualifying reset or Protocol you complete
                on a separate day adds one permanent day of care. Extra sessions
                never need to be farmed, and time away never removes your growth.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing['5xl'],
    gap: spacing.lg,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 48,
  },
  loadingCard: {
    ...card.base,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  errorTitle: {
    ...typography.title.title3,
    textAlign: 'center',
    color: colors.text.primary,
  },
  errorCopy: {
    ...typography.body.medium,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 18,
    backgroundColor: colors.primary.blue600,
  },
  retryButtonPressed: {
    opacity: 0.86,
  },
  retryLabel: {
    ...typography.button.medium,
    color: colors.text.inverse,
  },
  treeShadow: {
    ...card.blockShadow,
  },
  treeCard: {
    ...card.block,
    alignItems: 'center',
    padding: spacing.lg,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.playful.teal.ink,
  },
  stageTitle: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  careDays: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.playful.teal.ink,
  },
  progressGroup: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  progressTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: 'rgba(7,86,75,0.16)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.playful.teal.base,
  },
  progressCopy: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  infoCard: {
    ...card.base,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  infoTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  infoCopy: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
