import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Icon from '../../../components/common/icons/Icon';
import { Text } from '../../../components/common/Text';
import { card } from '../../../theme/card';
import { triggerTapHaptic } from '../../../native/tapHaptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import type { HomeTreeProgress } from '../domain/homeTreeProgress';
import GardenTreeImage from './GardenTreeImage';

const CARD_HEIGHT = 196;
const TREE_SIZE = 210;

interface HomeTreeHeroProps {
  progress: HomeTreeProgress | null;
  progressUnavailable?: boolean;
  caredToday: boolean;
  returning?: boolean;
  onPressGarden: () => void;
}

function getStateHeadline(
  progress: HomeTreeProgress,
  caredToday: boolean,
  returning: boolean,
): string {
  if (caredToday) return 'Your tree grew today';
  if (returning) return 'Your tree is here';
  if (progress.careDays === 0) return 'Your tree starts here';
  return 'Ready for today’s care';
}

export default function HomeTreeHero({
  progress,
  progressUnavailable = false,
  caredToday,
  returning = false,
  onPressGarden,
}: HomeTreeHeroProps) {
  const stateHeadline = progress == null
    ? progressUnavailable
      ? 'Tree unavailable right now'
      : 'Loading your tree…'
    : getStateHeadline(progress, caredToday, returning);

  const accessibilityLabel = progress == null
    ? `Your tree. ${stateHeadline}`
    : `Your tree. ${progress.stageLabel}. ${progress.careDays} care ${progress.careDays === 1 ? 'day' : 'days'}. ${stateHeadline}`;

  const content = (
    <View
      accessibilityLiveRegion={progress == null ? 'polite' : 'none'}
      style={styles.card}
    >
      <Text style={styles.overline} pointerEvents="none">YOUR TREE</Text>

      <View style={styles.copy} pointerEvents="none">
        <Text style={styles.headline} numberOfLines={2}>
          {stateHeadline}
        </Text>
        <View style={styles.viewGardenRow}>
          <Text style={styles.viewGardenLabel}>View garden</Text>
          <Icon name="chevron-right" size={18} color={colors.onBlock.textMuted} />
        </View>
      </View>

      <View style={styles.treeArt} pointerEvents="none">
        {progress == null ? (
          <View style={styles.loadingTree} />
        ) : (
          <GardenTreeImage stage={progress.stage} size={TREE_SIZE} />
        )}
      </View>

    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens your garden"
      onPress={() => {
        triggerTapHaptic();
        onPressGarden();
      }}
      style={({ pressed }) => [styles.shadow, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...card.blockShadow,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  card: {
    ...card.block,
    height: CARD_HEIGHT,
    padding: spacing.md,
    backgroundColor: colors.playful.sky.base,
  },
  copy: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    width: '52%',
    gap: 2,
    zIndex: 2,
  },
  overline: {
    ...typography.overline,
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.4,
    color: colors.text.inverse,
    opacity: 0.8,
    zIndex: 2,
  },
  headline: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.inverse,
  },
  treeArt: {
    position: 'absolute',
    top: 0,
    right: -spacing.md,
    bottom: -spacing.lg,
    width: '60%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  loadingTree: {
    width: 148,
    height: 148,
    marginBottom: spacing.lg,
    borderRadius: 999,
    backgroundColor: colors.onBlock.fill,
  },
  viewGardenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewGardenLabel: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    color: colors.onBlock.textMuted,
  },
});
