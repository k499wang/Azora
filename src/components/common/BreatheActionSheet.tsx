import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { type IconName } from './icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import type { BreathingTechnique } from '../../data/techniques';

export type BreatheActionId = 'daily' | 'breathe' | 'measure';

interface Props {
  visible: boolean;
  bottomOffset?: number;
  horizontalAnchor?: 'center' | 'right';
  onClose: () => void;
  onSelect: (id: BreatheActionId) => void;
  recommendedTechnique: BreathingTechnique | null;
  isRecommendedTechniqueLoading?: boolean;
}

interface Action {
  id: BreatheActionId;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  bg: string;
  disabled?: boolean;
}

const CATEGORY_ICON: Record<BreathingTechnique['category'], IconName> = {
  calm: 'meditation',
  focus: 'waves',
  energy: 'sparkle',
  sleep: 'moon',
  balance: 'waves',
};

function formatPattern(pattern: BreathingTechnique['pattern']): string {
  return [pattern.inhale, pattern.holdIn, pattern.exhale, pattern.holdOut]
    .filter((v) => v > 0)
    .join('-');
}

const TAB_BAR_HEIGHT = 74;
const TAIL_HEIGHT = 10;
const BUBBLE_GAP = 2;

export default function BreatheActionSheet({
  visible,
  bottomOffset,
  horizontalAnchor = 'center',
  onClose,
  onSelect,
  recommendedTechnique,
  isRecommendedTechniqueLoading = false,
}: Props) {
  const insets = useSafeAreaInsets();

  const actions = useMemo<Action[]>(() => {
    const breatheAction: Action =
      recommendedTechnique == null
        ? {
            id: 'breathe',
            title: 'Breathe',
            subtitle: isRecommendedTechniqueLoading
              ? 'Loading plan'
              : 'Plan unavailable',
            icon: 'meditation',
            color: colors.neutral[400],
            bg: colors.neutral[100],
            disabled: true,
          }
        : {
            id: 'breathe',
            title: 'Breathe',
            subtitle: formatPattern(recommendedTechnique.pattern),
            icon: CATEGORY_ICON[recommendedTechnique.category],
            color: colors.orange[500],
            bg: colors.orange[100],
          };

    return [
      {
        id: 'daily',
        title: 'Daily plan',
        subtitle: "Today's session",
        icon: 'meditation',
        color: colors.primary.blue600,
        bg: colors.primary.blue100,
      },
      breatheAction,
      {
        id: 'measure',
        title: 'Measure',
        subtitle: 'Heart rate',
        icon: 'heart',
        color: colors.error[500],
        bg: colors.error[100],
      },
    ];
  }, [isRecommendedTechniqueLoading, recommendedTechnique]);
  const resolvedBottomOffset = bottomOffset ?? insets.bottom + TAB_BAR_HEIGHT + BUBBLE_GAP;
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, progress]);

  if (!mounted) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.backdropFill, { opacity: progress }]} />
        <Animated.View
          style={[
            styles.anchor,
            horizontalAnchor === 'right' && styles.anchorRight,
            { bottom: resolvedBottomOffset, opacity: progress, transform: [{ translateY }] },
          ]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.bubble} onPress={(e) => e.stopPropagation()}>
            <ActionRow actions={actions} onClose={onClose} onSelect={onSelect} />
          </Pressable>
          <View style={[styles.tail, horizontalAnchor === 'right' && styles.tailRight]} />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function ActionRow({
  actions,
  onClose,
  onSelect,
}: {
  actions: Action[];
  onClose: () => void;
  onSelect: (id: BreatheActionId) => void;
}) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          disabled={action.disabled}
          onPress={() => {
            onSelect(action.id);
            onClose();
          }}
          style={({ pressed }) => [
            styles.actionItem,
            action.disabled && styles.actionItemDisabled,
            pressed && styles.actionItemPressed,
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: action.bg, borderColor: action.color },
            ]}
          >
            <Icon name={action.icon} size={28} color={action.color} />
          </View>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
  },
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  anchorRight: {
    alignItems: 'flex-end',
    paddingRight: spacing.lg,
  },
  bubble: {
    backgroundColor: colors.background.elevated,
    borderRadius: 24,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionItem: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 88,
    paddingVertical: spacing.xs,
  },
  actionItemPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  actionItemDisabled: {
    opacity: 0.55,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 2,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  actionSubtitle: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: TAIL_HEIGHT,
    borderRightWidth: TAIL_HEIGHT,
    borderTopWidth: TAIL_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.background.elevated,
    marginTop: -1,
  },
  tailRight: {
    marginRight: 28,
  },
});
