import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';
import Pill from './Pill';

interface AppTopBarProps {
  title?: string;
  streak?: string | number;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  showStreak?: boolean;
  showSettings?: boolean;
  onSettingsPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function AppTopBar({
  title = 'Brthe',
  streak = 7,
  leftSlot,
  rightSlot,
  showStreak = true,
  showSettings = true,
  onSettingsPress,
  style,
}: AppTopBarProps) {
  const leftContent =
    leftSlot ?? (showStreak ? <Pill icon="fire" label={String(streak)} /> : null);

  const rightContent =
    rightSlot ??
    (showSettings ? (
      <Pressable
        accessibilityLabel="Open settings"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onSettingsPress}
        style={styles.iconButton}
      >
        <MaterialCommunityIcons
          name="cog-outline"
          size={22}
          color={colors.text.secondary}
        />
      </Pressable>
    ) : null);

  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.centerLayer}>
        <Text numberOfLines={1} style={styles.brandTitle}>
          {title}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.sideSlot}>{leftContent}</View>
        <View style={[styles.sideSlot, styles.rightSlot]}>{rightContent}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    minHeight: spacing['4xl'],
    justifyContent: 'center',
  },
  centerLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: padding.screen.horizontal + spacing['5xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: padding.screen.horizontal,
  },
  sideSlot: {
    minWidth: spacing['4xl'],
    minHeight: 40,
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  brandTitle: {
    ...typography.title.title2,
    color: colors.text.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
