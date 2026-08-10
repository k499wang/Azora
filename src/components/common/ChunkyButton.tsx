import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerMediumHaptic, triggerTapHaptic } from '../../native/tapHaptics';

/**
 * The app's full-width primary action: a solid face resting on a darker lip, so
 * pressing it physically drops onto the lip rather than just dimming.
 *
 * The lip is drawn as bottom padding on the pressable, not as a negative
 * transform on the face. That keeps the button's layout box equal to what you
 * see — a face floated upward would sit higher than the slot it was given,
 * which matters where these are pinned above a safe-area inset.
 */

const LIP_DEPTH = 4;
const DEFAULT_MIN_HEIGHT = 56;

export interface ChunkyTone {
  face: string;
  lip: string;
  label: string;
}

/** Blue face, deeper blue lip. The default everywhere outside a colour block. */
export const CHUNKY_TONE: ChunkyTone = {
  face: colors.primary.blue600,
  lip: colors.primary.blue800,
  label: colors.text.inverse,
};

interface ChunkyButtonProps {
  label: string;
  onPress: () => void;
  /** `pill` for onboarding and paywall, `card` for in-app surfaces */
  shape?: 'pill' | 'card';
  tone?: ChunkyTone;
  disabled?: boolean;
  loading?: boolean;
  minHeight?: number;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  haptic?: 'medium' | 'tap' | 'none';
  style?: StyleProp<ViewStyle>;
}

export default function ChunkyButton({
  label,
  onPress,
  shape = 'pill',
  tone = CHUNKY_TONE,
  disabled = false,
  loading = false,
  minHeight = DEFAULT_MIN_HEIGHT,
  icon,
  trailingIcon,
  haptic = 'medium',
  style,
}: ChunkyButtonProps) {
  const isDisabled = disabled || loading;
  const shapeStyle = shape === 'pill' ? styles.pill : styles.card;

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic === 'medium') triggerMediumHaptic();
    if (haptic === 'tap') triggerTapHaptic();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={handlePress}
      style={[
        styles.lip,
        shapeStyle,
        { backgroundColor: tone.lip },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.face,
            shapeStyle,
            { backgroundColor: tone.face, minHeight },
            pressed && styles.facePressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={tone.label} />
          ) : (
            <>
              {icon}
              <Text style={[styles.label, { color: tone.label }]}>{label}</Text>
              {trailingIcon}
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lip: {
    alignSelf: 'stretch',
    paddingBottom: LIP_DEPTH,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  // Exactly the lip's depth, so the face lands flush with its bottom edge and
  // the button reads as fully depressed rather than nudged.
  facePressed: {
    transform: [{ translateY: LIP_DEPTH }],
  },
  pill: {
    borderRadius: 999,
  },
  card: {
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
