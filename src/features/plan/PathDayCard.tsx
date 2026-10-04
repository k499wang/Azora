import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { IconName } from '../../components/common/icons/paths';
import type { PathDetail, PathDetailRowKind } from './domain/planPath';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, spring } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const CARD_MAX_WIDTH = 400;
const TAIL = 18;
const CLOSE_ICON = 24;
const ROW_ICON = 32;
const ROW_CHECK = 18;
/** how small the card starts as it pops out of the node */
const POP_FROM_SCALE = 0.6;

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
}

interface Props {
  content: PathDayCardContent | null;
  visible: boolean;
  onClose: () => void;
}

/**
 * What a tapped node is, over the path rather than inside it: the page stays
 * where it was, and the card points back at the node it came from.
 */
export default function PathDayCard({ content, visible, onClose }: Props) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  // Held open past `visible` so the card can shrink back into its node.
  const [mounted, setMounted] = useState(visible);
  const [placed, setPlaced] = useState(false);
  const appear = useSharedValue(0);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      if (!placed) return;
      appear.value = reducedMotion
        ? withTiming(1, { duration: duration.fast })
        : withSpring(1, spring.snap);
      return;
    }
    const unmount = () => {
      setMounted(false);
      setPlaced(false);
    };
    appear.value = withTiming(
      0,
      { duration: duration.fast, easing: easing.exit },
      (finished) => {
        if (finished) runOnJS(unmount)();
      },
    );
  }, [appear, mounted, placed, reducedMotion, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(appear.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const close = () => {
    triggerTapHaptic();
    onClose();
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View pointerEvents="none" style={[styles.backdrop, backdropStyle]} />
      <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={close}>
        {content == null ? null : (
          <Placed
            content={content}
            window={window}
            insets={insets}
            appear={appear}
            reducedMotion={reducedMotion}
            onMeasured={() => setPlaced(true)}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{content.detail.title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={12}
                onPress={close}
              >
                <Icon name="close" size={CLOSE_ICON} color={colors.text.tertiary} />
              </Pressable>
            </View>
            {content.detail.focus == null ? null : (
              <Text style={styles.focus}>{content.detail.focus}</Text>
            )}
            {content.detail.rows.length === 0 ? null : (
              <View style={styles.rows}>
                {content.detail.rows.map((row, index) => (
                  <View key={`${row.kind}-${index}`} style={styles.row}>
                    <TaskIllustration name={ROW_ICONS[row.kind]} size={ROW_ICON} />
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
          </Placed>
        )}
      </Pressable>
    </Modal>
  );
}

/**
 * Hangs the card under the node, or stands it above when there is more room
 * there. Measured before it is shown, so a tall day never runs off the screen,
 * and popped out of the tail so it reads as coming from the node.
 */
function Placed({
  content,
  window,
  insets,
  appear,
  reducedMotion,
  onMeasured,
  children,
}: {
  content: PathDayCardContent;
  window: { width: number; height: number };
  insets: { top: number; bottom: number };
  appear: SharedValue<number>;
  reducedMotion: boolean;
  onMeasured: () => void;
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
  const originX = detached ? width / 2 : tailLeft + TAIL / 2;
  const originY = detached || height == null ? (height ?? 0) / 2 : above ? height : 0;

  const popStyle = useAnimatedStyle(() => ({
    opacity: interpolate(appear.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: reducedMotion
          ? 1
          : interpolate(appear.value, [0, 1], [POP_FROM_SCALE, 1]),
      },
    ],
  }));

  return (
    // Swallows taps so only the backdrop closes the card.
    <AnimatedPressable
      onPress={() => {}}
      onLayout={(event) => {
        setHeight(event.nativeEvent.layout.height);
        onMeasured();
      }}
      style={[
        styles.card,
        { width, left, top, transformOrigin: [originX, originY, 0] },
        popStyle,
      ]}
    >
      {detached ? null : (
        <View
          style={[styles.tail, above ? styles.tailBelow : styles.tailAbove, { left: tailLeft }]}
        />
      )}
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  focus: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
});
