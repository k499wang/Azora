import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/common/Text';
import AppTopBar from '../../components/common/AppTopBar';
import ChunkyButton from '../../components/common/ChunkyButton';
import { useOpenedFromLab } from './useOpenedFromLab';
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
 *   · titles are centred `display3`, one `2xl` below the bar
 *   · the room is centred, with `sectionGap` above it
 *   · the primary action is pinned to the bottom, never in the flow
 */

/** Reserved whether or not there is a caption, so the room cannot shift. */
const CAPTION_HEIGHT = 20;
/** One `display3` line, reserved on every room screen — see `RoomStage`. */
const BANNER_HEIGHT = 40;

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
  const insets = useSafeAreaInsets();
  const fromLab = useOpenedFromLab();

  const header =
    title == null ? null : (
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {note == null ? null : <Text style={styles.note}>{note}</Text>}
      </View>
    );

  return (
    <View style={styles.screen}>
      {/* No bar in the real flow — only the inset it would have cleared, so the
          room sits as high as it can without running under the notch. The lab
          gets a real bar, because it jumps into these screens out of order and
          you need a way back. */}
      {fromLab ? (
        <AppTopBar showBack showAvatar={false} showStreak={false} />
      ) : (
        <View style={{ height: insets.top }} />
      )}

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
 * The room never moves. Both the line above it and the line below it are
 * reserved whether or not there is anything to put in them — otherwise
 * congratulating someone shoves the thing they are being congratulated about
 * down the screen, mid-animation.
 *
 * The banner used to be an overlay hung off the top of the stage, which kept
 * the room still but drew the message outside the layout entirely — over the
 * top bar, on any screen that has one. A reserved slot does the same job
 * inside the bounds.
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
      <View pointerEvents="none" style={styles.bannerSlot}>
        {banner}
      </View>
      {children}
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
    <ChunkyButton
      label={label}
      shape="card"
      disabled={disabled}
      onPress={onPress}
    />
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
    textAlign: 'center',
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
    marginTop: margin.sectionGap,
    gap: spacing.sm,
  },
  bannerSlot: {
    height: BANNER_HEIGHT,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
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
});
