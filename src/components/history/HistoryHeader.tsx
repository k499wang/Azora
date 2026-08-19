import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import HistoryDateStrip from './HistoryDateStrip';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import type { WeekCalendarDay } from '../../lib/calendar/weekCalendarDays';

const CLOSE_SIZE = 40;
const BAR_HEIGHT = 56;

interface Props {
  title: string;
  days: WeekCalendarDay[];
  selectedLocalDate: string;
  onSelect: (localDate: string) => void;
  onClose: () => void;
}

/**
 * History's own header block. The shared `AppTopBar` carries an avatar, streak
 * and notification bell that this screen has no use for, and its tint is the
 * Home blue — a colored block with the date strip inside it is a different
 * shape, so it lives here rather than as a fourth variant of the top bar.
 */
export default function HistoryHeader({
  title,
  days,
  selectedLocalDate,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.block, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close history"
          hitSlop={spacing.sm}
          onPress={() => {
            triggerTapHaptic();
            onClose();
          }}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Icon name="close" size={18} color={colors.text.inverse} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Icon name="calendar" size={18} color={colors.text.inverse} />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.barSpacer} />
      </View>

      <HistoryDateStrip
        days={days}
        selectedLocalDate={selectedLocalDate}
        onSelect={onSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.playful.teal.base,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onBlock.fill,
  },
  pressed: {
    opacity: 0.7,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  barSpacer: {
    width: CLOSE_SIZE,
  },
});
