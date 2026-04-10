import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';

interface ExerciseScaffoldProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  pickerSlot?: ReactNode;
  centerSlot: ReactNode;
  bottomSlot: ReactNode;
  onClose?: () => void;
}

export default function ExerciseScaffold({
  title,
  subtitle,
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
          <View style={styles.titleCopy}>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.headerRight}>
            {rightSlot}
            {onClose ? (
              <Pressable onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text.secondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {pickerSlot ? <View>{pickerSlot}</View> : null}
      </View>

      <View style={styles.center}>{centerSlot}</View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>{bottomSlot}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'space-between',
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
    minHeight: spacing.xl + spacing.xs,
    justifyContent: 'center',
    alignItems: 'flex-end',
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  bottom: {
    paddingHorizontal: padding.screen.horizontal,
    zIndex: 10,
  },
});
