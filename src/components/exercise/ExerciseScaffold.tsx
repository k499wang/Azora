import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';
interface ExerciseScaffoldProps {
  title?: string;
  subtitle?: string;
  titleSlot?: ReactNode;
  rightSlot?: ReactNode;
  pickerSlot?: ReactNode;
  centerSlot: ReactNode;
  bottomSlot: ReactNode;
  onClose?: () => void;
}

export default function ExerciseScaffold({
  title,
  subtitle,
  titleSlot,
  rightSlot,
  pickerSlot,
  centerSlot,
  bottomSlot,
  onClose,
}: ExerciseScaffoldProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {!titleSlot && (
            <View style={styles.titleCopy}>
              {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
              {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
            </View>
          )}
          <View style={[styles.headerRight, titleSlot ? styles.headerRightPushed : null]}>
            {rightSlot}
            {onClose ? (
              <Pressable onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text.secondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {titleSlot ? (
          <View style={styles.titleSlotRow}>{titleSlot}</View>
        ) : null}

        {pickerSlot ? <View>{pickerSlot}</View> : null}
      </View>

      <View style={styles.center} pointerEvents="box-none">
        {centerSlot}
      </View>

      <View style={styles.spacer} />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>{bottomSlot}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
    gap: spacing.sm,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleCopy: {
    flex: 1,
  },
  titleSlotRow: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  headerRightPushed: {
    marginLeft: 'auto',
  },
  pageTitle: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
  pageSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: spacing.xl + spacing.xs,
    height: spacing.xl + spacing.xs,
    borderRadius: (spacing.xl + spacing.xs) / 2,
    backgroundColor: colors.neutral[100],
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingHorizontal: padding.screen.horizontal,
  },
});
