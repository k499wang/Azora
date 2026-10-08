import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import TaskIllustration from '../common/icons/TaskIllustration';
import type { ProfileRecord, ProfileRecordKey } from '../../lib/profileRecords';
import { formatProfileCount, formatProfileDate } from '../../lib/profileStatsFormat';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

const BADGE_SIZE = 56;

const RECORD_COPY: Record<ProfileRecordKey, { name: string; illustration: 'streakFilled' | 'room-hex' }> = {
  longestStreak: { name: 'Longest streak', illustration: 'streakFilled' },
  roomsFinished: { name: 'Rooms finished', illustration: 'room-hex' },
};

interface ProfileRecordsCardProps {
  records: ProfileRecord[];
}

export default function ProfileRecordsCard({ records }: ProfileRecordsCardProps) {
  return (
    <View style={styles.row}>
      {records.map((record) => {
        const copy = RECORD_COPY[record.key];
        return (
          <View key={record.key} style={styles.card}>
            <TaskIllustration name={copy.illustration} size={BADGE_SIZE} locked={record.locked} />
            <Text
              style={[styles.value, record.locked && styles.muted]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {record.locked ? '?' : formatProfileCount(record.value)}
            </Text>
            <Text style={[styles.name, record.locked && styles.muted]} numberOfLines={2}>
              {copy.name}
            </Text>
            {record.locked || record.localDate == null ? null : (
              <Text style={styles.date} numberOfLines={1}>
                {formatProfileDate(record.localDate)}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    ...card.base,
    ...card.lipped,
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  value: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  name: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  muted: {
    color: colors.text.tertiary,
  },
  date: {
    ...typography.label.small,
    color: colors.text.secondary,
  },
});
