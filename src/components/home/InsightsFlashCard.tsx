import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
import Icon from '../common/icons/Icon';
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
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const maxHeight = Object.values(measuredHeights).reduce(
    (max, h) => (h > max ? h : max),
    0,
  );
  const allMeasured =
    insights.length > 0 &&
    insights.every((ins) => measuredHeights[ins.id] !== undefined);
  const lockedHeight = allMeasured && maxHeight > 0 ? maxHeight : undefined;

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
  const hasCta = !!(displayed.techniqueId && displayed.ctaLabel && onStartTechnique);
  const unlockedContent = (
    <Animated.View
      style={[styles.contentRow, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.textColumn}>
        {clearHeader}
        <Text style={styles.detail}>{displayed.detail}</Text>
      </View>
      {hasCta ? (
        <Pressable
          onPress={() => onStartTechnique!(displayed.techniqueId!)}
          accessibilityRole="button"
          accessibilityLabel={displayed.ctaLabel}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.ctaPressed,
          ]}
        >
          <Icon name="play-triangle" size={18} color={colors.text.inverse} />
        </Pressable>
      ) : null}
    </Animated.View>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.measureLayer} pointerEvents="none" aria-hidden>
        {insights.map((ins) => {
          const insHasCta = !!(ins.techniqueId && ins.ctaLabel && onStartTechnique);
          return (
            <View
              key={ins.id}
              style={styles.card}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                setMeasuredHeights((prev) =>
                  prev[ins.id] === h ? prev : { ...prev, [ins.id]: h },
                );
              }}
            >
              <View style={styles.contentRow}>
                <View style={styles.textColumn}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.eyebrow}>{ins.eyebrow}</Text>
                  </View>
                  <Text style={styles.tone}>{ins.tone}</Text>
                  <Text style={styles.detail}>{ins.detail}</Text>
                </View>
                {insHasCta ? <View style={styles.startButton} /> : null}
              </View>
            </View>
          );
        })}
      </View>
      {locked ? (
        <View style={[styles.card, styles.lockedCard, lockedHeight ? { height: lockedHeight } : null]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.contentRow, { opacity, transform: [{ translateY }] }]}
          >
            <View style={styles.textColumn}>
              <View style={styles.lockedHiddenHeader}>{clearHeader}</View>
              <Text style={styles.detail}>{displayed.detail}</Text>
            </View>
            {hasCta ? <View style={styles.startButton} /> : null}
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
          style={({ pressed }) => [
            styles.card,
            lockedHeight ? { height: lockedHeight } : null,
            pressed && styles.cardPressed,
          ]}
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
  measureLayer: {
    position: 'absolute',
    left: padding.screen.horizontal,
    right: padding.screen.horizontal,
    opacity: 0,
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
  lockedHiddenHeader: {
    opacity: 0,
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textColumn: {
    flex: 1,
  },
  startButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue500,
  },
  ctaPressed: {
    opacity: 0.85,
  },
});
