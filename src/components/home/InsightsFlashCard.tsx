import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
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
  const clearHeader = (
    <>
      <View style={styles.cardHeader}>
        <Text style={styles.eyebrow}>{displayed.eyebrow}</Text>
      </View>
      <Text style={styles.tone}>{displayed.tone}</Text>
    </>
  );
  const unlockedContent = (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {clearHeader}
      <Text style={styles.detail}>{displayed.detail}</Text>
      {displayed.techniqueId && displayed.ctaLabel && onStartTechnique ? (
        <Pressable
          onPress={() => onStartTechnique(displayed.techniqueId!)}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
          ]}
        >
          <Text style={styles.ctaLabel}>{displayed.ctaLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );

  return (
    <View style={styles.wrap}>
      {locked ? (
        <View style={[styles.card, styles.lockedCard]}>
          <Animated.View
            pointerEvents="none"
            style={{ opacity, transform: [{ translateY }] }}
          >
            {clearHeader}
            <Text style={styles.detail}>{displayed.detail}</Text>
            {displayed.techniqueId && displayed.ctaLabel && onStartTechnique ? (
              <View style={styles.cta}>
                <Text style={styles.ctaLabel}>{displayed.ctaLabel}</Text>
              </View>
            ) : null}
          </Animated.View>
          <BlurView
            intensity={24}
            tint="light"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.clearOverlay} pointerEvents="box-none">
            {clearHeader}
          </View>
          {onPressUpgrade ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPressUpgrade}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={advance}
          disabled={insights.length <= 1}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          {unlockedContent}
        </Pressable>
      )}

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
  lockedCard: {
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  eyebrow: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.primary.blue600,
    flexShrink: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  clearOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
