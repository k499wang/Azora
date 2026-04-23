import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';

interface AppTopBarProps {
  title?: string;
  streak?: string | number;
  rightSlot?: ReactNode;
  showStreak?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppTopBar({
  title = 'Azora',
  streak = 7,
  rightSlot,
  showStreak = true,
  style,
}: AppTopBarProps) {
  const rightContent =
    rightSlot ??
    (showStreak ? (
      <View style={styles.streakPill}>
        <MaterialCommunityIcons name="fire" size={16} color={colors.orange[500]} />
        <Text style={styles.streakText}>{streak}</Text>
      </View>
    ) : null);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.brandRow}>
        <MaterialCommunityIcons
          name="weather-windy"
          size={24}
          color={colors.text.primary}
        />
        <Text style={styles.brandTitle}>{title}</Text>
      </View>

      {rightContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
    minHeight: spacing['4xl'],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  brandTitle: {
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.elevated,
    borderRadius: 999,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  streakText: {
    ...typography.label.medium,
    color: colors.text.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});
