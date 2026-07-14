import { Text } from '../common/Text';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';

interface OnboardingHapticSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  accent?: string;
  onChange: (value: number) => void;
}

const TICK_WIDTH = 22;
const MAJOR_EVERY = 5;

export default function OnboardingHapticSlider({
  min,
  max,
  step = 1,
  value,
  unit,
  accent = colors.primary.blue600,
  onChange,
}: OnboardingHapticSliderProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const lastValueRef = useRef(value);

  const tickCount = Math.floor((max - min) / step) + 1;
  const sidePadding = Math.max(containerWidth / 2 - TICK_WIDTH / 2, 0);

  useEffect(() => {
    if (containerWidth === 0) return;
    const index = Math.round((value - min) / step);
    scrollRef.current?.scrollTo({ x: index * TICK_WIDTH, animated: false });
    lastValueRef.current = value;
  }, [containerWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.max(0, Math.min(tickCount - 1, Math.round(offsetX / TICK_WIDTH)));
    const next = min + index * step;
    if (next !== lastValueRef.current) {
      lastValueRef.current = next;
      if (isHapticsEnabled()) {
        Haptics.selectionAsync().catch(() => {});
      }
      onChange(next);
    }
  };

  return (
    <View style={styles.wrap} onLayout={handleLayout}>
      <View style={styles.readout}>
        <Text style={[styles.value, { color: accent }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      <View style={styles.sliderArea}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_WIDTH}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: sidePadding }}
        >
          {Array.from({ length: tickCount }).map((_, i) => {
            const tickValue = min + i * step;
            const isMajor = tickValue % MAJOR_EVERY === 0;
            return (
              <View key={i} style={styles.tickSlot}>
                <View
                  style={[
                    styles.tick,
                    isMajor ? styles.tickMajor : styles.tickMinor,
                  ]}
                />
              </View>
            );
          })}
        </ScrollView>

        <View pointerEvents="none" style={styles.indicatorWrap}>
          <View style={[styles.indicator, { backgroundColor: accent }]} />
        </View>
      </View>
    </View>
  );
}

const INDICATOR_HEIGHT = 56;

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xl,
    alignItems: 'stretch',
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  value: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -1,
  },
  unit: {
    ...typography.body.large,
    color: colors.text.secondary,
  },
  sliderArea: {
    height: INDICATOR_HEIGHT,
    justifyContent: 'center',
  },
  tickSlot: {
    width: TICK_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    height: INDICATOR_HEIGHT,
  },
  tick: {
    width: 2,
    borderRadius: 2,
    backgroundColor: colors.border.default,
  },
  tickMajor: {
    height: 24,
    backgroundColor: colors.text.tertiary,
  },
  tickMinor: {
    height: 14,
  },
  indicatorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 3,
    height: INDICATOR_HEIGHT - 8,
    borderRadius: 2,
  },
});
