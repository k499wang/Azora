import { useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, Keyframe, runOnJS } from 'react-native-reanimated';
import Icon, { type IconName } from './icons/Icon';
import { Text } from './Text';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const MENU_MIN_WIDTH = 220;
const ITEM_STAGGER_MS = 40;

// Grows out of the trigger's corner, overshooting a touch before it settles.
const MENU_POP = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.6 }] },
  60: { opacity: 1, transform: [{ scale: 1.03 }], easing: easing.enter },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: easing.settle },
}).duration(duration.base);

const MENU_DISMISS = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 0.85 }], easing: easing.exit },
}).duration(duration.fast);

export interface PopupMenuItem {
  label: string;
  icon: IconName;
  iconColor?: string;
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
  top: number;
  bottom: number;
  right: number;
}

/** A trigger that opens a small white card of actions beside it. */
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
      setAnchor({ top: y, bottom: y + height, right: x + width });
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
        <Pressable accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={close} />
        {anchor == null || !open ? null : (
          <Animated.View
            entering={MENU_POP}
            exiting={dismissed}
            style={[
              card.base,
              card.shadow,
              styles.menu,
              { transformOrigin: placement === 'below' ? 'top right' : 'bottom right' },
              { right: window.width - anchor.right },
              placement === 'below'
                ? { top: anchor.bottom + spacing.sm }
                : { bottom: window.height - anchor.top + spacing.sm },
            ]}
          >
            {items.map((item, index) => (
              <Animated.View
                key={item.label}
                entering={(placement === 'below' ? FadeInUp : FadeInDown)
                  .delay(ITEM_STAGGER_MS * (placement === 'below' ? index : items.length - 1 - index))
                  .duration(duration.base)
                  .easing(easing.enter)}
              >
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => {
                    triggerTapHaptic();
                    choose(item.onPress);
                  }}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                >
                  <Text style={styles.label}>{item.label}</Text>
                  <Icon name={item.icon} size={20} color={item.iconColor ?? colors.text.secondary} />
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
  menu: {
    position: 'absolute',
    minWidth: MENU_MIN_WIDTH,
    paddingVertical: spacing.xs,
    borderRadius: radius.medium,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  itemPressed: {
    backgroundColor: colors.background.canvas,
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.border.subtle,
  },
});
