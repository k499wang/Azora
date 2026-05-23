import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
import ProLockedOverlay from './ProLockedOverlay';
import type { Insight } from '../../lib/insights';

interface Props {
  insights: Insight[];
  locked?: boolean;
  onPressUpgrade?: () => void;
  onStartTechnique?: (techniqueId: string) => void;
}

const TRANSITION_MS = 180;

export default function InsightsFlashCard({
  insights,
  locked = false,
  onPressUpgrade,
  onStartTechnique,
}: Props) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState<Insight | null>(insights[0] ?? null);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (insights.length === 0) {
      setDisplayed(null);
      return;
    }
    const safe = index % insights.length;
    const next = insights[safe];
    if (displayed && displayed.id === next.id) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: TRANSITION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -6,
        duration: TRANSITION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayed(next);
      translateY.setValue(6);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: TRANSITION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: TRANSITION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [index, insights, displayed, opacity, translateY]);

  if (insights.length === 0 || !displayed) return null;

  const safeIndex = index % insights.length;
  const advance = () => setIndex((i) => (i + 1) % insights.length);

  return (
    <View style={styles.wrap}>
      <ProLockedOverlay
        locked={locked}
        onPressUpgrade={onPressUpgrade}
        subtext="Personalized insights are part of Azora Pro."
      >
        <Pressable
          onPress={advance}
          disabled={locked || insights.length <= 1}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <Text style={styles.eyebrow}>{displayed.eyebrow}</Text>
            <Text style={styles.tone}>{displayed.tone}</Text>
            <Text style={styles.detail}>{displayed.detail}</Text>
            {displayed.techniqueId && displayed.ctaLabel && onStartTechnique ? (
              <Pressable
                onPress={() => onStartTechnique(displayed.techniqueId!)}
                disabled={locked}
                style={({ pressed }) => [
                  styles.cta,
                  pressed && styles.ctaPressed,
                ]}
              >
                <Text style={styles.ctaLabel}>{displayed.ctaLabel}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </Pressable>

        {insights.length > 1 ? (
          <View style={styles.dots}>
            {insights.map((ins, i) => (
              <View
                key={ins.id}
                style={[
                  styles.dot,
                  i === safeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        ) : null}
      </ProLockedOverlay>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  card: {
    ...card.base,
    ...card.shadow,
    minHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  eyebrow: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.primary.blue600,
    marginBottom: spacing.xs,
  },
  tone: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  detail: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.text.primary,
  },
  dotInactive: {
    backgroundColor: colors.neutral[300],
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.primary.blue500,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
});
