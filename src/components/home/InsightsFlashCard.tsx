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
import MaskedView from '@react-native-masked-view/masked-view';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import BinderRings, { BinderHoleMask } from './BinderRings';
import ProUpgradeButton from '../common/ProUpgradeButton';
import type { Insight } from '../../lib/insights';
import CardSurface from '../common/CardSurface';

interface Props {
  insights: Insight[];
  locked?: boolean;
  onPressUpgrade?: () => void;
  onStartTechnique?: (techniqueId: string) => void;
}

const CARD_HEIGHT = 172;
const DETAIL_MAX_LINES = 3;
const CAROUSEL_CARD_GAP = 16;

export default function InsightsFlashCard({
  insights,
  locked = false,
  onPressUpgrade,
  onStartTechnique,
}: Props) {
  const [index, setIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - padding.screen.horizontal * 2;
  const slideWidth = cardWidth + CAROUSEL_CARD_GAP * 2;
  const cardHeight = CARD_HEIGHT;

  if (insights.length === 0) return null;

  const safeIndex = index % insights.length;

  return (
    <View style={styles.wrap}>
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
                cardWidth={cardWidth}
                cardHeight={cardHeight}
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

const CARD_MASK_INSET = 16;

function InsightCard({
  insight,
  locked,
  cardWidth,
  cardHeight,
  onPressUpgrade,
  onStartTechnique,
}: {
  insight: Insight;
  locked: boolean;
  cardWidth: number;
  cardHeight: number;
  onPressUpgrade?: () => void;
  onStartTechnique?: (techniqueId: string) => void;
}) {
  const hasCta = !!(insight.techniqueId && insight.ctaLabel && onStartTechnique);
  const clearHeader = (
    <>
      <View style={styles.cardHeader}>
        <Text style={styles.eyebrow} numberOfLines={1}>{insight.eyebrow}</Text>
      </View>
      <Text style={styles.tone} numberOfLines={1}>{insight.tone}</Text>
    </>
  );

  const content = (
    <View style={styles.contentRow}>
      <View style={styles.textColumn}>
        {clearHeader}
        <Text style={styles.detail} numberOfLines={DETAIL_MAX_LINES} ellipsizeMode="tail">
          {insight.detail}
        </Text>
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

  const surface = !locked ? (
    <CardSurface containerStyle={styles.cardContainerFill} style={styles.card}>
      {content}
    </CardSurface>
  ) : (
    <CardSurface locked containerStyle={styles.cardContainerFill} style={styles.card}>
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
    </CardSurface>
  );

  const maskWidth = cardWidth + CARD_MASK_INSET * 2;
  const maskHeight = cardHeight + CARD_MASK_INSET * 2;

  return (
    <View style={styles.cardWrap}>
      <MaskedView
        style={[
          styles.maskRoot,
          { width: maskWidth, height: maskHeight },
        ]}
        maskElement={
          <BinderHoleMask
            width={maskWidth}
            height={maskHeight}
            inset={CARD_MASK_INSET}
          />
        }
      >
        <View style={styles.maskInner}>{surface}</View>
      </MaskedView>
      <BinderRings />
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
  carouselItem: {
    height: '100%',
    paddingHorizontal: CAROUSEL_CARD_GAP,
  },
  cardWrap: {
    height: '100%',
    position: 'relative',
  },
  maskRoot: {
    position: 'absolute',
    top: -CARD_MASK_INSET,
    left: -CARD_MASK_INSET,
  },
  maskInner: {
    flex: 1,
    padding: CARD_MASK_INSET,
  },
  cardContainerFill: {
    flex: 1,
  },
  card: {
    height: '100%',
    minHeight: 140,
    paddingLeft: spacing.xl,
    paddingRight: spacing.lg,
    paddingVertical: spacing.lg,
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
    marginBottom: spacing.md,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
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
