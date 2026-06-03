import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LockedScrim } from '../common/glass';
import Carousel from 'react-native-reanimated-carousel';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
import Icon from '../common/icons/Icon';
import BinderRings from './BinderRings';
import ProUpgradeButton from '../common/ProUpgradeButton';
import type { Insight } from '../../lib/insights';

interface Props {
  insights: Insight[];
  locked?: boolean;
  onPressUpgrade?: () => void;
  onStartTechnique?: (techniqueId: string) => void;
}

const FALLBACK_CARD_HEIGHT = 172;
const CAROUSEL_CARD_GAP = 16;

export default function InsightsFlashCard({
  insights,
  locked = false,
  onPressUpgrade,
  onStartTechnique,
}: Props) {
  const [index, setIndex] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - padding.screen.horizontal * 2;
  const slideWidth = cardWidth + CAROUSEL_CARD_GAP * 2;

  const maxHeight = Object.values(measuredHeights).reduce(
    (max, h) => (h > max ? h : max),
    0,
  );
  const allMeasured =
    insights.length > 0 &&
    insights.every((ins) => measuredHeights[ins.id] !== undefined);
  const cardHeight = allMeasured && maxHeight > 0 ? maxHeight : FALLBACK_CARD_HEIGHT;

  if (insights.length === 0) return null;

  const safeIndex = index % insights.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.measureLayer} pointerEvents="none" aria-hidden>
        {insights.map((ins) => {
          const insHasCta = !!(ins.techniqueId && ins.ctaLabel && onStartTechnique);
          return (
            <View
              key={ins.id}
              style={styles.measureCard}
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
      <View style={[styles.carouselFrame, { width: slideWidth }]}>
        <Carousel
          data={insights}
          width={slideWidth}
          height={cardHeight}
          loop={false}
          enabled={insights.length > 1}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 1,
            parallaxScrollingOffset: 28,
            parallaxAdjacentItemScale: 0.9,
          }}
          onSnapToItem={setIndex}
          renderItem={({ item }) => (
            <View style={styles.carouselItem}>
              <InsightCard
                insight={item}
                locked={locked}
                onPressUpgrade={onPressUpgrade}
                onStartTechnique={onStartTechnique}
              />
            </View>
          )}
        />
      </View>

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

function InsightCard({
  insight,
  locked,
  onPressUpgrade,
  onStartTechnique,
}: {
  insight: Insight;
  locked: boolean;
  onPressUpgrade?: () => void;
  onStartTechnique?: (techniqueId: string) => void;
}) {
  const hasCta = !!(insight.techniqueId && insight.ctaLabel && onStartTechnique);
  const clearHeader = (
    <>
      <View style={styles.cardHeader}>
        <Text style={styles.eyebrow}>{insight.eyebrow}</Text>
      </View>
      <Text style={styles.tone}>{insight.tone}</Text>
    </>
  );

  const content = (
    <View style={styles.contentRow}>
      <View style={styles.textColumn}>
        {clearHeader}
        <Text style={styles.detail}>{insight.detail}</Text>
      </View>
      {hasCta ? (
        locked ? (
          <View style={styles.startButton} />
        ) : (
          <Pressable
            onPress={() => onStartTechnique!(insight.techniqueId!)}
            accessibilityRole="button"
            accessibilityLabel={insight.ctaLabel}
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.ctaPressed,
            ]}
          >
            <Icon name="play-triangle" size={18} color={colors.text.inverse} />
          </Pressable>
        )
      ) : null}
    </View>
  );

  if (!locked) {
    return (
      <View style={styles.card}>
        <BinderRings />
        {content}
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.lockedCard]}>
      <BinderRings />
      <View pointerEvents="none">{content}</View>
      <LockedScrim />
      {onPressUpgrade ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPressUpgrade}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.lockedPill} pointerEvents="box-none">
        <ProUpgradeButton onPress={onPressUpgrade} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: padding.screen.horizontal,
    overflow: 'visible',
  },
  carouselFrame: {
    alignSelf: 'center',
  },
  measureLayer: {
    position: 'absolute',
    left: padding.screen.horizontal,
    right: padding.screen.horizontal,
    opacity: 0,
  },
  carouselItem: {
    height: '100%',
    paddingHorizontal: CAROUSEL_CARD_GAP,
  },
  measureCard: {
    ...card.base,
    ...card.shadow,
    minHeight: 140,
    paddingLeft: spacing.xl,
    paddingRight: spacing.lg,
    paddingVertical: spacing.lg,
  },
  card: {
    ...card.base,
    ...card.shadow,
    height: '100%',
    minHeight: 140,
    paddingLeft: spacing.xl,
    paddingRight: spacing.lg,
    paddingVertical: spacing.lg,
  },
  lockedCard: {
    overflow: 'hidden',
  },
  lockedPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
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
    gap: spacing.lg,
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
