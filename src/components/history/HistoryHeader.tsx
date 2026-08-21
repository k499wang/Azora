import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import CloseButton, { CLOSE_BUTTON_SIZE } from '../common/CloseButton';
import HistoryDateStrip from './HistoryDateStrip';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { WeekCalendarDay } from '../../lib/calendar/weekCalendarDays';

const BAR_HEIGHT = 56;

interface Props {
  title: string;
  days: WeekCalendarDay[];
  selectedLocalDate: string;
  onSelect: (localDate: string) => void;
  onClose: () => void;
  jumpToLatestToken: number;
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
  jumpToLatestToken,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.block, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <CloseButton
          onBlock
          accessibilityLabel="Close history"
          onPress={onClose}
        />

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
        jumpToLatestToken={jumpToLatestToken}
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
    width: CLOSE_BUTTON_SIZE,
  },
});
