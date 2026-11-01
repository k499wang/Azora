import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Keyframe, runOnJS } from 'react-native-reanimated';
import TaskIllustration from './icons/TaskIllustration';
import { Text } from './Text';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const ITEM_STAGGER_MS = 40;
const ILLUSTRATION_SIZE = 28;

// Each pill rises out of the trigger and eases to rest, with no overshoot.
const PILL_POP = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: spacing.sm }, { scale: 0.9 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: easing.settle },
}).duration(duration.base);

const MENU_DISMISS = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 0.96 }], easing: easing.exit },
}).duration(duration.fast);

export interface PopupMenuItem {
  label: string;
  icon: ComponentProps<typeof TaskIllustration>['name'];
  onPress: () => void;
}

interface Props {
  items: PopupMenuItem[];
  /** which side of the trigger the menu opens on; its right edge lines up with the trigger's */
  placement: 'above' | 'below';
  accessibilityLabel: string;
  /** handed whether the menu is open, so the trigger can show it */
  children: (open: boolean) => ReactNode;
}

interface Anchor {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A trigger that dims the screen and opens a stack of action pills beside it, nearest first, like a FAB menu. */
export default function PopupMenu({ items, placement, accessibilityLabel, children }: Props) {
  const trigger = useRef<View>(null);
  const window = useWindowDimensions();
  // The anchor outlives `open` by the dismiss animation, keeping the modal up
  // until the menu has faded out of it.
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [open, setOpen] = useState(false);
  // A chosen action usually opens a sheet, which is another modal and cannot
  // present until this one is gone — so choosing drops the menu at once and the
  // action runs the moment the modal has dismissed, not after a fade.
  const chosen = useRef<(() => void) | null>(null);

  const show = () => {
    triggerTapHaptic();
    trigger.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ left: x, top: y, width, height });
      setOpen(true);
    });
  };
  // A second tap on the backdrop drops the modal outright, in case the dismiss
  // animation never reported back.
  const close = () => (open ? setOpen(false) : setAnchor(null));
  const choose = (action: () => void) => {
    chosen.current = action;
    setOpen(false);
    setAnchor(null);
  };
  const runChosen = () => {
    const action = chosen.current;
    chosen.current = null;
    action?.();
  };
  // Cleared even when the fade is interrupted (a tap off mid pop-in), or the
  // invisible modal would stay up swallowing every touch.
  const dismissed = MENU_DISMISS.withCallback(() => {
    'worklet';
    runOnJS(setAnchor)(null);
  });

  return (
    <>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={show}
        style={({ pressed }) => pressed && pressable.control}
      >
        {children(open)}
      </Pressable>
      <Modal transparent statusBarTranslucent visible={anchor != null} animationType="none" onRequestClose={close} onDismiss={runChosen}>
        {open ? (
          <Animated.View
            pointerEvents="none"
            entering={FadeIn.duration(duration.base)}
            exiting={FadeOut.duration(duration.fast)}
            style={[StyleSheet.absoluteFill, styles.scrim]}
          />
        ) : null}
        <Pressable accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={close} />
        {anchor == null ? null : (
          // The trigger again, above the dim, so its close mark stays bright.
          <Pressable
            accessibilityLabel="Close menu"
            onPress={close}
            style={[styles.triggerCopy, anchor]}
          >
            {children(open)}
          </Pressable>
        )}
        {anchor == null || !open ? null : (
          <Animated.View
            exiting={dismissed}
            style={[
              styles.menu,
              { transformOrigin: placement === 'below' ? 'top right' : 'bottom right' },
              { right: window.width - (anchor.left + anchor.width) },
              placement === 'below'
                ? { top: anchor.top + anchor.height + spacing.sm }
                : { bottom: window.height - anchor.top + spacing.sm },
            ]}
          >
            {items.map((item, index) => (
              <Animated.View
                key={item.label}
                entering={PILL_POP.delay(
                  (placement === 'above' ? items.length - 1 - index : index) * ITEM_STAGGER_MS,
                )}
              >
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => {
                    triggerTapHaptic();
                    choose(item.onPress);
                  }}
                  style={({ pressed }) => [card.base, card.shadow, styles.item, pressed && styles.itemPressed]}
                >
                  <TaskIllustration name={item.icon} size={ILLUSTRATION_SIZE} />
                  <Text style={styles.label}>{item.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: colors.overlay.menu,
  },
  triggerCopy: {
    position: 'absolute',
  },
  menu: {
    position: 'absolute',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.mdPlus,
    borderRadius: radius.full,
  },
  itemPressed: {
    transform: [{ scale: 0.96 }],
  },
  label: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
