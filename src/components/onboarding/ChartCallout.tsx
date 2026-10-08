import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { card, radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { chart, chartText } from './chartTokens';

interface Props {
  x: number;
  y: number;
  label: string;
  mood: 'calm' | 'tense';
  side: 'left' | 'right';
}

const FACE = chart.faceSize;
const TAIL = 6;

const FACE_LOOK = {
  calm: {
    icon: 'faceCalm',
    fill: colors.playful.sky.soft,
    ink: colors.playful.sky.ink,
  },
  tense: {
    icon: 'faceTense',
    fill: colors.playful.coral.base,
    ink: colors.text.inverse,
  },
} as const;

export default function ChartCallout({
  x,
  y,
  label,
  mood,
  side,
}: Props) {
  const look = FACE_LOOK[mood];
  const onLeft = side === 'left';

  // The lane runs from the face to the edge of the plot on the bubble's side,
  // so the bubble always has the plot's width to lay its label out in.
  const lane = onLeft
    ? { left: 0, width: x + FACE / 2, justifyContent: 'flex-end' as const }
    : { left: x - FACE / 2, right: 0, justifyContent: 'flex-start' as const };

  return (
    <View pointerEvents="none" style={[styles.lane, { top: y - FACE / 2 }, lane]}>
      <View style={[styles.callout, onLeft ? styles.calloutLeft : null]}>
        <View style={[styles.face, { backgroundColor: look.fill }]}>
          <Icon name={look.icon} size={FACE * 0.72} color={look.ink} />
        </View>
        <View style={[styles.tail, onLeft ? styles.tailRight : styles.tailLeft]} />
        <View style={styles.bubble}>
          <Text style={chartText.bubble} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lane: {
    position: 'absolute',
    height: FACE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutLeft: {
    flexDirection: 'row-reverse',
  },
  face: {
    width: FACE,
    height: FACE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    ...card.base,
    ...card.shadow,
    borderRadius: radius.small,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tail: {
    width: 0,
    height: 0,
    borderTopWidth: TAIL,
    borderBottomWidth: TAIL,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    zIndex: 1,
  },
  tailLeft: {
    borderRightWidth: TAIL,
    borderRightColor: colors.background.card,
    marginLeft: spacing.xs,
    marginRight: -1,
  },
  tailRight: {
    borderLeftWidth: TAIL,
    borderLeftColor: colors.background.card,
    marginLeft: -1,
    marginRight: spacing.xs,
  },
});
