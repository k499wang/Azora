import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import CardSurface from '../common/CardSurface';
import { Text } from '../common/Text';
import OnboardingOptionIcon, {
  type OnboardingOptionIconName,
} from './OnboardingOptionIcon';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

export interface PlanJourneyStop {
  day: number;
  line: string;
  icon: OnboardingOptionIconName;
  accent: string;
  title?: string;
  targetDate?: string;
  backgroundColor?: string;
  iconBackgroundColor?: string;
}

interface PlanJourneyProps {
  stops: PlanJourneyStop[];
  /** Share of the row each card takes, leaving room for the alternating path. */
  cardWidth?: number;
}

/** Share of the row a card takes, so the stops can zigzag either side. */
const CARD_WIDTH = 0.74;
const TRAIL_HEIGHT = 40;
const DOT_SIZE = 4;
const ICON_SIZE = 34;

/**
 * The plan as a path: one short card per stop, alternating sides, with a
 * dotted trail walking from each card to the next.
 */
export default function PlanJourney({ stops, cardWidth = CARD_WIDTH }: PlanJourneyProps) {
  const [width, setWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  return (
    <View onLayout={handleLayout}>
      {stops.map((stop, index) => {
        const onLeft = index % 2 === 0;
        return (
          <View key={stop.day}>
            {index > 0 ? <Trail width={width} cardWidth={cardWidth} towardLeft={onLeft} /> : null}
            <CardSurface
              surface={stop.backgroundColor == null ? undefined : 'solid'}
              style={[
                styles.card,
                { width: `${cardWidth * 100}%` },
                onLeft ? styles.left : styles.right,
                stop.backgroundColor != null && { backgroundColor: stop.backgroundColor },
              ]}
            >
              <View style={stop.iconBackgroundColor == null ? undefined : [
                styles.iconBadge,
                { backgroundColor: stop.iconBackgroundColor },
              ]}>
                <OnboardingOptionIcon
                  name={stop.icon}
                  size={ICON_SIZE}
                  color={stop.accent}
                />
              </View>
              <View style={styles.copy}>
                <Text style={stop.title == null ? styles.day : styles.stopLabel}>
                  {`Day ${stop.day}${stop.targetDate == null ? '' : ` · ${stop.targetDate}`}`}
                </Text>
                {stop.title != null ? <Text style={styles.day}>{stop.title}</Text> : null}
                <Text style={styles.line}>{stop.line}</Text>
              </View>
            </CardSurface>
          </View>
        );
      })}
    </View>
  );
}

function Trail({ width, cardWidth, towardLeft }: { width: number; cardWidth: number; towardLeft: boolean }) {
  if (width === 0) return <View style={styles.trail} />;

  const leftCentre = (width * cardWidth) / 2;
  const rightCentre = width - leftCentre;
  const [from, to] = towardLeft
    ? [rightCentre, leftCentre]
    : [leftCentre, rightCentre];
  const top = DOT_SIZE / 2;
  const bottom = TRAIL_HEIGHT - DOT_SIZE / 2;
  const middle = TRAIL_HEIGHT / 2;

  return (
    <Svg width={width} height={TRAIL_HEIGHT} style={styles.trail}>
      <Path
        d={`M ${from} ${top} C ${from} ${middle}, ${to} ${middle}, ${to} ${bottom}`}
        stroke={colors.primary.blue300}
        strokeWidth={DOT_SIZE}
        strokeLinecap="round"
        strokeDasharray={`0 ${DOT_SIZE * 2.5}`}
        fill="none"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.card,
  },
  copy: {
    flex: 1,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: radius.full,
  },
  stopLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  day: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  line: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  left: {
    alignSelf: 'flex-start',
  },
  right: {
    alignSelf: 'flex-end',
  },
  trail: {
    height: TRAIL_HEIGHT,
  },
});
