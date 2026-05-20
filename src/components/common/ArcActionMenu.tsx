import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import Icon, { type IconName } from './icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';

const canUseLiquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArcAction {
  /** Unique identifier passed back in `onSelect` */
  id: string;
  /** Primary label displayed beneath the icon */
  title: string;
  /** Secondary label (e.g. duration, pattern) */
  subtitle: string;
  /** Icon name from the app's custom icon set */
  icon: IconName;
  /** Accent color for the icon and border */
  color: string;
  /** Whether the action is tappable */
  disabled?: boolean;
}

export interface ArcActionMenuProps {
  /** Controls menu visibility */
  visible: boolean;
  /** Vertical distance from screen bottom to the anchor point (FAB center) */
  anchorBottomOffset: number;
  /** Horizontal alignment of the anchor point */
  anchorHorizontalAlign?: 'center' | 'right' | 'left';
  /** Actions to fan out above the anchor */
  actions: ArcAction[];
  /** Called when the user dismisses the menu via backdrop */
  onClose: () => void;
  /** Called when an action is selected */
  onSelect: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const ARC_RADIUS = 108;

/** Angles (degrees) for each slot when 3 items are provided. 0 = right, -90 = up */
const THREE_ITEM_ANGLES = [-128, -90, -52];

function getArcPosition(index: number, total: number) {
  // For 3 items use the preset fan; otherwise spread evenly around -90°
  const angleDeg =
    total === 3
      ? THREE_ITEM_ANGLES[index] ?? -90
      : -90 + (index - (total - 1) / 2) * 40;
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: ARC_RADIUS * Math.cos(rad),
    y: ARC_RADIUS * Math.sin(rad),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ArcActionMenu
 *
 * A floating action menu that presents items in an arc above an anchor point.
 * Designed to pair with a center or edge-aligned FAB. Each action button uses
 * the native iOS glass / blur effect when available.
 *
 * Best practices demonstrated here:
 * - Pure presentational component: no navigation or business logic.
 * - Minimal public API: only visibility, geometry, actions, and callbacks.
 * - Self-contained animation lifecycle: mounts on open, unmounts after close.
 * - Native-driver animations only for 60 fps performance.
 */
export default function ArcActionMenu({
  visible,
  anchorBottomOffset,
  anchorHorizontalAlign = 'center',
  actions,
  onClose,
  onSelect,
}: ArcActionMenuProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  // One animated value per item so we can stagger springs independently
  const itemAnims = useRef(actions.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);

      // Fade in backdrop scrim
      Animated.timing(progress, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      // Stagger items outward with spring physics
      Animated.stagger(
        45,
        itemAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 7,
            tension: 100,
            useNativeDriver: true,
          })
        )
      ).start();
    } else if (mounted) {
      // Fade out backdrop
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();

      // Collapse items simultaneously (slightly faster than open)
      Animated.parallel(
        itemAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 160,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, progress, itemAnims]);

  if (!mounted) return null;

  const anchorStyle =
    anchorHorizontalAlign === 'right'
      ? styles.anchorRight
      : anchorHorizontalAlign === 'left'
      ? styles.anchorLeft
      : null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop — tappable to dismiss */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.backdropFill, { opacity: progress }]} />
      </Pressable>

      {/* Anchor sits at the FAB center — items fan out from here */}
      <View
        pointerEvents="box-none"
        style={[styles.anchor, anchorStyle, { bottom: anchorBottomOffset }]}
      >
        {actions.map((action, index) => {
          const pos = getArcPosition(index, actions.length);
          const anim = itemAnims[index];

          const translateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, pos.x],
          });
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, pos.y],
          });
          const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.35, 1],
          });
          const opacity = anim.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 1, 1],
          });

          return (
            <Animated.View
              key={action.id}
              pointerEvents="box-none"
              style={[
                styles.actionWrap,
                {
                  opacity,
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            >
              <Pressable
                disabled={action.disabled}
                onPress={() => {
                  onSelect(action.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.actionPressable,
                  action.disabled && styles.actionDisabled,
                  pressed && styles.actionPressed,
                ]}
              >
                <GlassActionCircle borderColor={action.color}>
                  <Icon name={action.icon} size={28} color={action.color} />
                </GlassActionCircle>
                <Text style={styles.actionTitle} numberOfLines={1}>
                  {action.title}
                </Text>
                <Text style={styles.actionSubtitle} numberOfLines={1}>
                  {action.subtitle}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * GlassActionCircle
 *
 * Wraps an action icon in a circular glass / blur container.
 * Prefers the native liquid-glass effect and falls back to expo-blur.
 */
function GlassActionCircle({
  borderColor,
  children,
}: {
  borderColor: string;
  children: ReactNode;
}) {
  if (canUseLiquidGlass) {
    return (
      <GlassView
        colorScheme="light"
        glassEffectStyle="clear"
        isInteractive
        style={[styles.iconCircle, { borderColor }]}
        tintColor="rgba(255,255,255,0.35)"
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={72}
      tint="systemUltraThinMaterialLight"
      style={[styles.iconCircle, { borderColor }]}
    >
      {children}
    </BlurView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ICON_SIZE = 64;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
  },
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorRight: {
    alignItems: 'flex-end',
    paddingRight: spacing.lg + 31, // align to center of right-edge FAB
  },
  anchorLeft: {
    alignItems: 'flex-start',
    paddingLeft: spacing.lg + 31,
  },
  actionWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPressable: {
    alignItems: 'center',
    gap: 4,
    width: 92,
  },
  actionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  actionDisabled: {
    opacity: 0.45,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginTop: 2,
  },
  actionSubtitle: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
