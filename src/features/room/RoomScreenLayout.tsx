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
 */

/** Reserved whether or not there is a caption, so the room cannot shift. */
const CAPTION_HEIGHT = 20;

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
      {/* Back exists for poking around the room flow in the lab. In a release
          build these screens are reached one way and left one way, so a back
          arrow would offer an exit the flow has no state for. */}
      <AppTopBar showBack={__DEV__} showAvatar={false} showStreak={false} />

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

/**
 * The room, centred, with an optional line under it and an optional message
 * above it.
 *
 * The room never moves. A message arriving above it is drawn as an overlay
 * rather than a sibling, and the caption's line is reserved whether or not
 * there is a caption — otherwise congratulating someone shoves the thing they
 * are being congratulated about down the screen, mid-animation.
 */
export function RoomStage({
  children,
  caption,
  banner,
}: {
  children: ReactNode;
  caption?: string;
  banner?: ReactNode;
}) {
  return (
    <View style={styles.stage}>
      <View>
        {children}
        {banner == null ? null : (
          <View pointerEvents="none" style={styles.banner}>
            {banner}
          </View>
        )}
      </View>
      <View style={styles.captionSlot}>
        {caption == null ? null : (
          <Text style={styles.caption}>{caption}</Text>
        )}
      </View>
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
  // Top-anchored, exactly like the scrolling variant. Centring these instead
  // put the room at a different height depending on which screen you were on,
  // so moving between them looked like the room jumped.
  fixedBody: {
    flex: 1,
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
  banner: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  captionSlot: {
    height: CAPTION_HEIGHT,
    justifyContent: 'center',
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
