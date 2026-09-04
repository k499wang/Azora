import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type PanResponderGestureState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';

const DRAG_ACTIVATION_PX = 4;
const DRAG_DISMISS_PX = 120;
const DRAG_DISMISS_VELOCITY = 0.7;
const SHEET_FALLBACK_HEIGHT = 600;
const SHEET_ENTER_DURATION = 240;
const SHEET_EXIT_DURATION = 260;
// A sheet already most of the way down has little left to travel, and holding
// the full duration for it reads as the sheet sticking to the finger that just
// let go. The floor keeps a flick from finishing so fast it never registers.
const SHEET_EXIT_MIN_DURATION = 120;

interface SlideUpSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /**
   * Drawn beside the grabber, inside the region that drags the sheet. Text
   * only — a control put here would lose its taps to the drag responder.
   */
  header?: ReactNode;
  /** the sheet's surface; defaults to the app canvas */
  backgroundColor?: string;
  /** padding and gap for the sheet's own content */
  sheetStyle?: StyleProp<ViewStyle>;
  /**
   * Take the screen rather than only as much of it as the content needs,
   * leaving the page showing as a strip above. For sheets that are a task in
   * themselves — a form — rather than a handful of choices about the page
   * behind them.
   */
  fullHeight?: boolean;
  /**
   * Drag the sheet from anywhere on it, not just the grabber. For sheets whose
   * content does not scroll — a vertical drag inside a scrolling sheet belongs
   * to the list, not to the sheet around it.
   */
  dragAnywhere?: boolean;
  onDismissed?: () => void;
}

/**
 * The app's slide-up presentation: a sheet that rises off the bottom edge while
 * the scrim behind it fades in separately.
 *
 * Those two have to be separate animations. Sliding the whole layer — scrim
 * included — drags a hard grey edge up the screen behind the sheet, which reads
 * as a second panel arriving rather than as the page dimming behind this one.
 * The scrim belongs to the screen underneath and never moves.
 */
export default function SlideUpSheet({
  visible,
  onClose,
  children,
  header,
  backgroundColor = colors.background.canvas,
  sheetStyle,
  fullHeight = false,
  dragAnywhere = false,
  onDismissed,
}: SlideUpSheetProps) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_FALLBACK_HEIGHT)).current;
  const sheetHeight = useRef(SHEET_FALLBACK_HEIGHT);
  // How far down the sheet was left by the finger, and how fast it was moving
  // when it let go. The exit picks up from both, so a dismissed sheet carries
  // on from where the drag put it instead of restarting from the top.
  const dragOffset = useRef(0);
  const flingVelocity = useRef(0);
  // Set while the grabber owns the gesture, so the sheet around it does not try
  // to steal a drag that is already being handled.
  const dragging = useRef(false);
  const onCloseRef = useRef(onClose);
  const onDismissedRef = useRef(onDismissed);
  const [mounted, setMounted] = useState(visible);

  onCloseRef.current = onClose;
  onDismissedRef.current = onDismissed;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragOffset.current = 0;
      flingVelocity.current = 0;
      translateY.setValue(sheetHeight.current);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: SHEET_ENTER_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: SHEET_ENTER_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    // Linear the whole way out, at a pace set by what is left to travel and by
    // the speed the finger was already moving, so the sheet leaving is the same
    // motion as the drag rather than a separate animation played after it.
    const height = Math.max(1, sheetHeight.current);
    const remaining = Math.max(0, height - dragOffset.current);
    const velocity = flingVelocity.current;
    flingVelocity.current = 0;
    const paced =
      velocity > 0
        ? remaining / velocity
        : (remaining / height) * SHEET_EXIT_DURATION;
    const duration = Math.round(
      Math.min(SHEET_EXIT_DURATION, Math.max(SHEET_EXIT_MIN_DURATION, paced)),
    );

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: height,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      dragOffset.current = 0;
      setMounted(false);
      onDismissedRef.current?.();
    });
  }, [visible, backdropOpacity, translateY]);

  const { handleResponder, surfaceResponder } = useMemo(() => {
    // The scrim thins in step with the drag, so pulling the sheet down reveals
    // the page under it continuously instead of holding a flat dim until the
    // finger lifts and deciding all at once.
    const track = (offset: number) => {
      dragOffset.current = offset;
      translateY.setValue(offset);
      backdropOpacity.setValue(
        Math.max(0, 1 - offset / Math.max(1, sheetHeight.current)),
      );
    };

    const settle = () => {
      dragOffset.current = 0;
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.spring(backdropOpacity, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 0,
        }),
      ]).start();
    };

    const isVerticalDrag = (gesture: PanResponderGestureState) =>
      Math.abs(gesture.dy) > DRAG_ACTIVATION_PX &&
      Math.abs(gesture.dy) > Math.abs(gesture.dx);

    // Shared by both responders below, so wherever the drag was picked up it
    // moves and ends the sheet the same way.
    const drag = {
      onPanResponderGrant: () => {
        dragging.current = true;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_: unknown, gesture: PanResponderGestureState) =>
        track(Math.max(0, gesture.dy)),
      onPanResponderRelease: (
        _: unknown,
        gesture: PanResponderGestureState,
      ) => {
        dragging.current = false;
        if (gesture.dy > DRAG_DISMISS_PX || gesture.vy > DRAG_DISMISS_VELOCITY) {
          flingVelocity.current = Math.max(0, gesture.vy);
          onCloseRef.current();
          return;
        }
        settle();
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        settle();
      },
    };

    return {
      /**
       * The grabber strip. It takes the touch the moment a finger lands on it,
       * which is what makes grabbing the top of the sheet and pulling down feel
       * immediate — there is nothing up there to press, so there is nothing to
       * lose by claiming it.
       */
      handleResponder: PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        ...drag,
      }),
      /**
       * The rest of the sheet. This one must not claim on touch-down — every
       * button on the sheet lives under it — so it waits for a clear vertical
       * drag and then takes the gesture on the way down, before the control the
       * finger happens to be on. The bubbling check alone is not enough: it is
       * only ever asked when nothing else already holds the responder, and a
       * `Pressable` grabs that on contact. The button reads the steal as a
       * cancelled press, which is the right end for a press that became a drag.
       */
      surfaceResponder: PanResponder.create({
        onStartShouldSetPanResponderCapture: () => false,
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          !dragging.current && isVerticalDrag(gesture),
        onMoveShouldSetPanResponder: (_, gesture) =>
          !dragging.current && isVerticalDrag(gesture),
        ...drag,
      }),
    };
  }, [backdropOpacity, translateY]);

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[styles.backdropFill, { opacity: backdropOpacity }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <Animated.View
          onLayout={(event) => {
            sheetHeight.current = event.nativeEvent.layout.height;
          }}
          style={[
            styles.sheet,
            fullHeight
              ? [styles.sheetFull, { marginTop: insets.top + spacing.md }]
              : styles.sheetContained,
            { backgroundColor },
            sheetStyle,
            {
              paddingBottom: insets.bottom + spacing.lg,
              transform: [{ translateY }],
            },
          ]}
          {...(dragAnywhere ? surfaceResponder.panHandlers : null)}
        >
          <View style={styles.dragArea} {...handleResponder.panHandlers}>
            <View style={styles.grabber} />
            {header}
          </View>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: 'continuous',
    paddingTop: spacing.sm,
  },
  // Grows with its content, up to most of the screen.
  sheetContained: {
    maxHeight: '90%',
  },
  // Takes everything under the status bar, however little content it has.
  sheetFull: {
    flex: 1,
  },
  // The bar is 5pt of drawing. The padding is the band you can actually grab it
  // by, and the matching negative margins hand that space straight back, so the
  // handle is three times the size it looks without moving anything on the
  // sheet. Both edges stay inside the sheet's own gap, clear of any content.
  dragArea: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    marginTop: -spacing.sm,
    marginBottom: -spacing.md,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: radius.full,
    alignSelf: 'center',
    backgroundColor: colors.neutral[300],
  },
});
