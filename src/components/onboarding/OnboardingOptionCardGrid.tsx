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

const GLYPH_SIZE = 96;

export interface OnboardingOptionCard<Id extends string> {
  id: Id;
  title: string;
  accent: string;
  icon?: OnboardingOptionIconName;
}

interface OnboardingOptionCardGridProps<Id extends string> {
  options: OnboardingOptionCard<Id>[];
  selectedIds: Id[];
  onSelect: (id: Id) => void;
  disabled?: boolean;
  animate?: boolean;
  multiSelect?: boolean;
  renderGlyph?: (option: OnboardingOptionCard<Id>) => ReactNode;
}

export default function OnboardingOptionCardGrid<Id extends string>({
  options,
  selectedIds,
  onSelect,
  disabled = false,
  animate = false,
  multiSelect = false,
  renderGlyph,
}: OnboardingOptionCardGridProps<Id>) {
  const cardAnims = useRef(
    options.map(() => new Animated.Value(animate ? 0 : 1)),
  ).current;

  useEffect(() => {
    if (!animate) return;
    const animation = Animated.stagger(
      45,
      cardAnims.map((anim) =>
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
  }, [animate, cardAnims]);

  const handlePress = (id: Id) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(id);
  };

  return (
    <View
      style={styles.grid}
      accessibilityRole={multiSelect ? undefined : 'radiogroup'}
    >
      {options.map((option, index) => {
        const selected = selectedIds.includes(option.id);
        const anim = cardAnims[index];

        return (
          <Animated.View
            key={option.id}
            style={[
              styles.slot,
              {
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
              accessibilityState={
                multiSelect ? { checked: selected, disabled } : { selected, disabled }
              }
              disabled={disabled}
              onPress={() => handlePress(option.id)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: option.accent },
                pressed && styles.cardPressed,
                disabled && !selected && styles.cardDisabled,
                selected && styles.cardSelected,
              ]}
            >
              <View style={styles.glyph} pointerEvents="none">
                {renderGlyph?.(option) ??
                (option.icon ? (
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={GLYPH_SIZE}
                    color={colors.text.inverse}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginTop: spacing.sm,
  },
  slot: {
    width: '50%',
    padding: spacing.xs,
  },
  card: {
    ...card.block,
    flex: 1,
    minHeight: 78,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: spacing.md,
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: colors.text.primary,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardDisabled: {
    opacity: 0.5,
  },
  glyph: {
    position: 'absolute',
    right: -20,
    bottom: -18,
    opacity: 0.18,
  },
  title: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.inverse,
  },
});
