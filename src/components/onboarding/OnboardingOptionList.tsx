import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';
import type { OnboardingOptionIconName } from './OnboardingOptionIcon';

const GLYPH_SIZE = 28;
const GLYPH_COLUMN = 40;

export interface OnboardingOption<Id extends string> {
  id: Id;
  title: string;
  /** the option's colour — it tints the icon, never the surface */
  accent: string;
  icon?: OnboardingOptionIconName;
}

interface OnboardingOptionListProps<Id extends string> {
  options: OnboardingOption<Id>[];
  selectedIds: Id[];
  onSelect: (id: Id) => void;
  disabled?: boolean;
  animate?: boolean;
  multiSelect?: boolean;
  renderGlyph?: (option: OnboardingOption<Id>) => ReactNode;
}

/**
 * One option per row: an outlined off-white card, the option's colour carried
 * by its icon, and the label in the app's normal reading colour.
 *
 * Colour used to fill the whole card, which put white text on six different
 * hues and made every option a separate contrast problem — light fills failed
 * outright and dark ones turned the screen muddy. A row keeps the colour as
 * accent, lets long labels ("A friend or family member") sit on one line, and
 * makes selection a single blue state rather than one per hue.
 */
export default function OnboardingOptionList<Id extends string>({
  options,
  selectedIds,
  onSelect,
  disabled = false,
  animate = false,
  multiSelect = false,
  renderGlyph,
}: OnboardingOptionListProps<Id>) {
  const rowAnims = useRef(
    options.map(() => new Animated.Value(animate ? 0 : 1)),
  ).current;

  useEffect(() => {
    if (!animate) return;
    const animation = Animated.stagger(
      45,
      rowAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 420,
          delay: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [animate, rowAnims]);

  const handlePress = (id: Id) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(id);
  };

  return (
    <View
      style={styles.list}
      accessibilityRole={multiSelect ? undefined : 'radiogroup'}
    >
      {options.map((option, index) => {
        const selected = selectedIds.includes(option.id);
        const anim = rowAnims[index];

        return (
          <Animated.View
            key={option.id}
            style={{
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            }}
          >
            <Pressable
              accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
              accessibilityState={
                multiSelect ? { checked: selected, disabled } : { selected, disabled }
              }
              disabled={disabled}
              onPress={() => handlePress(option.id)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
                disabled && !selected && styles.rowDisabled,
                selected && styles.rowSelected,
              ]}
            >
              <View style={styles.glyph} pointerEvents="none">
                {renderGlyph?.(option) ??
                (option.icon ? (
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={GLYPH_SIZE}
                    color={option.accent}
                  />
                ) : null)}
              </View>
              <Text style={styles.title}>{option.title}</Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    ...card.base,
    // Near-white rather than the pure card white: the outline is what makes a
    // row a row here, and the fill sits a shade back from white so the rows do
    // not read as slabs stacked on the canvas.
    backgroundColor: colors.background.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    // The selected border is drawn on every row so selecting one does not
    // change its size and nudge the rows under it.
    borderWidth: 2,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary.blue600,
    backgroundColor: colors.primary.blue100,
  },
  rowPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  rowDisabled: {
    opacity: 0.5,
  },
  glyph: {
    width: GLYPH_COLUMN,
    alignItems: 'center',
  },
  title: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    flex: 1,
    color: colors.text.primary,
  },
});
