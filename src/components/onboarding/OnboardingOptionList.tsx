import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { pauseSessionReplay } from '../../services/analytics/sessionReplay';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import OnboardingOptionIcon, {
  type OnboardingOptionIconName,
} from './OnboardingOptionIcon';

const GLYPH_SIZE = 28;
const GLYPH_COLUMN = 40;
const CHECK_SIZE = 24;
const MARK_SIZE = CHECK_SIZE - 8;

/**
 * The row's add/added mark: a grey circle holding a plus that turns over into a
 * white check on a blue circle when the option is picked. The fill colour has
 * to interpolate, so the whole toggle runs off the JS driver — it is a 24pt
 * badge, and keeping one value in charge is worth more here than the thread.
 */
function OptionCheckToggle({ selected }: { selected: boolean }) {
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, selected]);

  return (
    <Animated.View
      style={[
        styles.check,
        {
          backgroundColor: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.neutral[300], colors.primary.blue500],
          }),
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.mark,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 0, 0],
            }),
            transform: [
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '90deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Icon name="plus-bold" size={MARK_SIZE} color={colors.neutral[0]} />
      </Animated.View>
      <Animated.View
        style={[
          styles.mark,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
            }),
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Icon name="check-bold" size={MARK_SIZE} color={colors.neutral[0]} />
      </Animated.View>
    </Animated.View>
  );
}

export interface OnboardingOption<Id extends string> {
  id: Id;
  title: string;
  /** the option's colour — it tints the icon, never the surface */
  accent: string;
  icon?: OnboardingOptionIconName;
  /**
   * The answer said inside one of the app's sentences, for the screens that
   * quote it back later. Authored here rather than derived from `title`, which
   * is first person — see `src/lib/onboardingEcho.ts`.
   */
  echo?: string;
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
 * One option per row: a white card behind a thin outline, the option's colour
 * carried by its icon, and the label in the app's normal reading colour.
 *
 * Colour used to fill the whole card, which put white text on six different
 * hues and made every option a separate contrast problem — light fills failed
 * outright and dark ones turned the screen muddy. A row keeps the colour as
 * accent, lets long labels ("A friend or family member") sit on one line, and
 * makes selection a single blue state rather than one per hue.
 *
 * A multi-select list also carries an add/added toggle per row: its selections
 * persist until the screen is submitted, so they have to be scannable. A
 * single-select row advances immediately and needs no mark to leave behind.
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
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.rowPressed,
                disabled && !selected && styles.rowDisabled,
              ]}
            >
              {hasGlyphs ? (
                <View style={styles.glyph} pointerEvents="none">
                  {renderGlyph?.(option) ??
                    (option.icon ? (
                      <OnboardingOptionIcon
                        name={option.icon}
                        size={GLYPH_SIZE}
                        color={option.accent}
                      />
                    ) : null)}
                </View>
              ) : null}
              {/* A centred label is centred in the space left over, so the
                  toggle on the right would push every word off the card's
                  middle. Balancing it on the left gives the text the whole
                  row to centre in. */}
              {!hasGlyphs && multiSelect ? (
                <View style={styles.checkBalance} pointerEvents="none" />
              ) : null}
              <Text style={[styles.title, !hasGlyphs && styles.titleCentered]}>
                {option.title}
              </Text>
              {multiSelect ? <OptionCheckToggle selected={selected} /> : null}
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
    backgroundColor: colors.background.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // The extra border weight is taken out of the padding, so picking a row does
  // not resize it and nudge the rows under it.
  rowSelected: {
    borderWidth: 2,
    borderColor: colors.primary.blue500,
    paddingHorizontal: spacing.md - 1,
    paddingVertical: spacing.sm - 1,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  glyph: {
    width: GLYPH_COLUMN,
    alignItems: 'center',
  },
  checkBalance: {
    width: CHECK_SIZE,
  },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Both marks share the circle's centre so one can fade into the other.
  mark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCentered: {
    textAlign: 'center',
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
