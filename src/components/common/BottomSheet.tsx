import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import SlideUpSheet from './SlideUpSheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** `center` for sheets that are their own destination rather than a list of options. */
  titleAlign?: 'left' | 'center';
  onDismissed?: () => void;
}

/** A titled slide-up sheet: the shell plus the heading that names it. */
export default function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  titleAlign = 'left',
  onDismissed,
}: BottomSheetProps) {
  const centered = titleAlign === 'center';
  return (
    <SlideUpSheet
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      sheetStyle={styles.sheet}
      header={
        <View style={[styles.header, centered && styles.headerCentered]}>
          <Text style={[styles.title, centered && styles.centeredText]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, centered && styles.centeredText]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      }
    >
      {children}
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: 2,
  },
  headerCentered: {
    alignItems: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
});
