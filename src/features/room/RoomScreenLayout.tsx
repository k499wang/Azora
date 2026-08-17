import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/common/Text';
import AppTopBar from '../../components/common/AppTopBar';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Rise } from '../../components/common/Reveal';
import { useOpenedFromLab } from './useOpenedFromLab';
import { colors } from '../../theme/colors';
import { stagger } from '../../theme/motion';
import { margin, padding, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

/**
 * The shared shell for every room screen.
 *
 * These four screens each invented their own answer to the same questions —
 * where the title sits and whether it is centred, whether the body scrolls,
 * whether the action button floats or flows — and the room appeared to move
 * between them. One layout owns all of it.
 *
 * Rules it encodes:
 *   · titles are centred `display3` in one fixed place — see `RoomScreenTitle`
 *   · the room is centred, with `sectionGap` above it
 *   · the primary action is pinned to the bottom, never in the flow
 *   · a screen that waits on its room speaks and offers its button together
 */

/**
 * The beat between the room settling and the screen speaking over it. Long
 * enough that the piece is seen landing, short enough not to feel stalled.
 */
const REVEAL_DELAY = stagger.loose * 2;

interface RoomScreenLayoutProps {
  title?: string;
  note?: string;
  /**
   * Holds the title and the action back until this turns true, then plays them
   * in together. Both hold their space from the start, so the room underneath
   * does not move when they arrive.
   *
   * The layout owns this because the two have to be in sync, and two screens
   * agreeing on a delay is not sync — it is a coincidence that lasts until
   * someone edits one of them. Omit it when the title is simply there.
   */
  reveal?: boolean;
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
  reveal,
  scroll = false,
  action,
  children,
}: RoomScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const fromLab = useOpenedFromLab();

  const enter = (node: ReactNode) =>
    reveal === undefined ? (
      node
    ) : (
      <Rise when={reveal} delay={REVEAL_DELAY}>
        {node}
      </Rise>
    );

  const header =
    title == null ? null : enter(<RoomScreenTitle title={title} note={note} />);

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

      {action == null ? null : (
        <View style={styles.tray}>{enter(action)}</View>
      )}
    </View>
  );
}

/**
 * The one place a room screen puts a title.
 *
 * Every room screen says something above its room, and each of them used to say
 * it somewhere slightly different — a screen title here, a section heading
 * inside a card there, a congratulation floating over the room on a third. Same
 * sentence, three heights. This is the only one.
 *
 * Private: a screen names its title through `title`, and everything about how
 * that title looks and when it arrives is decided here.
 */
function RoomScreenTitle({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {note == null ? null : <Text style={styles.note}>{note}</Text>}
    </View>
  );
}

/** The room, centred. */
export function RoomStage({ children }: { children: ReactNode }) {
  return <View style={styles.stage}>{children}</View>;
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
    marginTop: spacing.lg,
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
    marginTop: spacing.lg,
  },
  tray: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: margin.sectionGap,
    paddingTop: spacing.sm,
  },
});
