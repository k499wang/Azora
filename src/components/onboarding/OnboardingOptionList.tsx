import { useEffect, useMemo, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { pauseSessionReplay } from '../../services/analytics/sessionReplay';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';
import type { OnboardingOptionIconName } from './OnboardingOptionIcon';

const GLYPH_SIZE = 28;
const GLYPH_COLUMN = 40;
/** Shallower than `ChunkyButton`'s lip: a row is a choice, not the action. */
const LIP_DEPTH = 2;

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
 *
 * The lip under each row carries the border's own colour, so it reads as a
 * thicker bottom edge rather than a shadow. Pressing drops the row onto it.
 */
export default function OnboardingOptionList<Id extends string>({
  options,
  selectedIds,
  onSelect,
  disabled = false,
  animate = true,
  multiSelect = false,
  renderGlyph,
}: OnboardingOptionListProps<Id>) {
  // Two question screens in a row render the same component in the same slot,
  // so React reuses this instance and only the options change. The entrance is
  // therefore keyed on which options these are — not on the instance, which
  // never remounts, and not on their count, which two six-option questions
  // share.
  const optionKey = options.map((option) => option.id).join('|');
  const rowAnims = useMemo(
    () => options.map(() => new Animated.Value(animate ? 0 : 1)),
    [animate, optionKey],
  );

  useEffect(() => {
    if (!animate) return;
    rowAnims.forEach((anim) => anim.setValue(0));
    const resumeReplay = pauseSessionReplay();
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
    animation.start(resumeReplay);
    return () => {
      animation.stop();
      resumeReplay();
    };
  }, [animate, rowAnims]);

  // A list with nothing in the glyph column would otherwise hang every label
  // off an empty 40pt gutter, so a picture-less list centres its labels instead.
  const hasGlyphs =
    renderGlyph != null ||
    options.some((option) => option.icon != null);

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
              style={[
                styles.lip,
                selected && styles.lipSelected,
                disabled && !selected && styles.rowDisabled,
              ]}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.row,
                    selected && styles.rowSelected,
                    pressed && styles.rowPressed,
                  ]}
                >
                  {hasGlyphs ? (
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
                  ) : null}
                  <Text style={[styles.title, !hasGlyphs && styles.titleCentered]}>
                    {option.title}
                  </Text>
                </View>
              )}
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
  lip: {
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.neutral[200],
    paddingBottom: LIP_DEPTH,
  },
  lipSelected: {
    backgroundColor: colors.primary.blue600,
  },
  row: {
    ...card.base,
    // The page canvas itself: the outline is the whole row, so an unselected
    // option reads as an outlined area of the page rather than a card on it.
    backgroundColor: colors.background.canvas,
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
  // Exactly the lip's depth, so the row lands flush on its bottom edge.
  rowPressed: {
    transform: [{ translateY: LIP_DEPTH }],
  },
  rowDisabled: {
    opacity: 0.5,
  },
  glyph: {
    width: GLYPH_COLUMN,
    alignItems: 'center',
  },
  titleCentered: {
    textAlign: 'center',
  },
  title: {
    ...typography.label.large,
    fontFamily: fonts.regular,
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 22,
    flex: 1,
    color: colors.text.primary,
  },
});
