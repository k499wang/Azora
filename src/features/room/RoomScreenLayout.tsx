import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import AppTopBar from '../../components/common/AppTopBar';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { margin, padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/**
 * The shared shell for every room screen.
 *
 * These four screens each invented their own answer to the same questions —
 * where the title sits and whether it is centred, whether the body scrolls,
 * whether the action button floats or flows — and the room appeared to move
 * between them. One layout owns all of it.
 *
 * Rules it encodes:
 *   · titles are left-aligned `display3`, one `2xl` below the bar
 *   · the room is centred, with `sectionGap` above it
 *   · the primary action is pinned to the bottom, never in the flow
 *   · every screen can go back
 */

interface RoomScreenLayoutProps {
  title?: string;
  note?: string;
  /**
   * Scrolls when the content can outgrow the screen. Pagers and single rooms
   * stay fixed and centre themselves instead.
   */
  scroll?: boolean;
  /** pinned above the bottom edge */
  action?: ReactNode;
  children: ReactNode;
}

export default function RoomScreenLayout({
  title,
  note,
  scroll = false,
  action,
  children,
}: RoomScreenLayoutProps) {
  const header =
    title == null ? null : (
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {note == null ? null : <Text style={styles.note}>{note}</Text>}
      </View>
    );

  return (
    <View style={styles.screen}>
      <AppTopBar showBack showAvatar={false} showStreak={false} />

      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <>
          {header}
          <View style={styles.fixedBody}>{children}</View>
        </>
      )}

      {action == null ? null : <View style={styles.tray}>{action}</View>}
    </View>
  );
}

/** The room, centred, with an optional line under it. */
export function RoomStage({
  children,
  caption,
}: {
  children: ReactNode;
  caption?: string;
}) {
  return (
    <View style={styles.stage}>
      {children}
      {caption == null ? null : (
        <Text style={styles.caption}>{caption}</Text>
      )}
    </View>
  );
}

/** The one button shape these screens use. */
export function RoomActionButton({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scrollBody: {
    paddingBottom: spacing['5xl'],
  },
  fixedBody: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing['2xl'],
    gap: spacing.xs,
  },
  title: {
    ...typography.display.display3,
    color: colors.text.primary,
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  stage: {
    alignItems: 'center',
    marginTop: margin.sectionGap,
    gap: spacing.sm,
  },
  caption: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  tray: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: margin.sectionGap,
    paddingTop: spacing.sm,
  },
  button: {
    ...card.shadow,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary.blue600,
  },
  buttonDisabled: {
    backgroundColor: colors.border.default,
  },
  buttonLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
});
