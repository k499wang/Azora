import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ChunkyButton from '../../components/common/ChunkyButton';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { IconName } from '../../components/common/icons/paths';
import type { PathDetail, PathDetailRowKind } from './domain/planPath';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const CARD_MAX_WIDTH = 400;
const TAIL = 18;
const CLOSE_ICON = 24;
const BUTTON_HEIGHT = 52;
const ROW_ICON = 24;
const ROW_CHECK = 18;

const ROW_ICONS: Record<PathDetailRowKind, IconName> = {
  exercise: 'lotus',
  checkIn: 'face-calm',
  lesson: 'book',
};

/** Where the tapped node sits on screen, from `measureInWindow`. */
export interface PathNodeAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PathDayCardContent {
  detail: PathDetail;
  anchor: PathNodeAnchor;
  hue: { base: string; ink: string };
}

interface Props {
  content: PathDayCardContent | null;
  visible: boolean;
  onClose: () => void;
  onGoToToday: () => void;
}

/**
 * What a tapped node is, over the path rather than inside it: the page stays
 * where it was, and the card points back at the node it came from.
 */
export default function PathDayCard({ content, visible, onClose, onGoToToday }: Props) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const close = () => {
    triggerTapHaptic();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable accessibilityLabel="Close" style={styles.backdrop} onPress={close}>
        {content == null ? null : (
          <Placed key={content.detail.eyebrow} content={content} window={window} insets={insets}>
            <View style={styles.header}>
              <Text style={[styles.eyebrow, { color: content.hue.ink }]}>
                {content.detail.eyebrow}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={12}
                onPress={close}
              >
                <Icon name="close" size={CLOSE_ICON} color={colors.text.tertiary} />
              </Pressable>
            </View>
            <Text style={styles.title}>{content.detail.title}</Text>
            {content.detail.focus == null ? null : (
              <View style={styles.focus}>
                {content.detail.focus.heading == null ? null : (
                  <Text style={styles.focusHeading}>{content.detail.focus.heading}</Text>
                )}
                <Text style={styles.focusText}>{content.detail.focus.text}</Text>
              </View>
            )}
            {content.detail.rows.length === 0 ? null : (
              <View style={styles.rows}>
                {content.detail.rows.map((row, index) => (
                  <View key={`${row.kind}-${index}`} style={styles.row}>
                    <Icon name={ROW_ICONS[row.kind]} size={ROW_ICON} color={colors.playful.sky.base} />
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    {content.detail.rowsDone ? (
                      <Icon name="check-bold" size={ROW_CHECK} color={colors.playful.sky.base} />
                    ) : row.minutes == null ? null : (
                      <Text style={styles.rowMinutes}>{row.minutes} min</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            {content.detail.goesToToday ? (
              <ChunkyButton
                label="Go to today"
                onPress={onGoToToday}
                minHeight={BUTTON_HEIGHT}
                haptic="tap"
                style={styles.button}
              />
            ) : null}
          </Placed>
        )}
      </Pressable>
    </Modal>
  );
}

/**
 * Hangs the card under the node, or stands it above when there is more room
 * there. Measured before it is shown, so a tall day never runs off the screen.
 */
function Placed({
  content,
  window,
  insets,
  children,
}: {
  content: PathDayCardContent;
  window: { width: number; height: number };
  insets: { top: number; bottom: number };
  children: ReactNode;
}) {
  const { anchor } = content;
  const width = Math.min(CARD_MAX_WIDTH, window.width - spacing.md * 2);
  const left = (window.width - width) / 2;
  const nodeCentre = anchor.x + anchor.width / 2;
  const tailLeft = Math.max(
    spacing.xl,
    Math.min(width - spacing.xl - TAIL, nodeCentre - left - TAIL / 2),
  );
  const [height, setHeight] = useState<number | null>(null);

  const belowTop = anchor.y + anchor.height + TAIL / 2;
  const roomBelow = window.height - insets.bottom - spacing.md - belowTop;
  const roomAbove = anchor.y - TAIL / 2 - insets.top - spacing.md;
  const above = height != null && height > roomBelow && roomAbove > roomBelow;
  const preferred = above && height != null ? anchor.y - TAIL / 2 - height : belowTop;
  // Never off the screen: a card with no room on either side slides to fit,
  // and drops its tail rather than point at the wrong place.
  const minTop = insets.top + spacing.md;
  const maxTop = window.height - insets.bottom - spacing.md - (height ?? 0);
  const top = Math.max(minTop, Math.min(preferred, maxTop));
  const detached = Math.abs(top - preferred) > 1;

  return (
    // Swallows taps so only the backdrop closes the card.
    <Pressable
      onPress={() => {}}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      style={[styles.card, { width, left, top, opacity: height == null ? 0 : 1 }]}
    >
      {detached ? null : (
        <View
          style={[styles.tail, above ? styles.tailBelow : styles.tailAbove, { left: tailLeft }]}
        />
      )}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
  },
  card: {
    position: 'absolute',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.large,
    borderCurve: 'continuous',
    backgroundColor: colors.background.elevated,
    ...card.shadowModal,
  },
  tail: {
    position: 'absolute',
    width: TAIL,
    height: TAIL,
    backgroundColor: colors.background.elevated,
    transform: [{ rotate: '45deg' }],
  },
  tailAbove: {
    top: -TAIL / 2,
  },
  tailBelow: {
    bottom: -TAIL / 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  focus: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  focusHeading: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  focusText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  rows: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  rowMinutes: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  button: {
    marginTop: spacing.md,
  },
});
