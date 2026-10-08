import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../components/common/Text';
import { formatProfileCount, formatProfileDate } from '../../lib/profileStatsFormat';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { MASCOT_NAME } from './mascot';

const AZO_HEAD = require('../../../assets/mascot/azo-head.png');
const PORTRAIT_SIZE = 72;
const CLIP_WIDTH = 56;
const CLIP_HEIGHT = 16;

interface AzoIdCardProps {
  movedInLocalDate: string | null;
  humanName: string | null;
  daysTogether: number | null;
}

export default function AzoIdCard({ movedInLocalDate, humanName, daysTogether }: AzoIdCardProps) {
  const rows = [
    { label: 'Moved in', value: movedInLocalDate == null ? null : formatProfileDate(movedInLocalDate) },
    { label: 'Human', value: humanName },
    { label: 'Days together', value: daysTogether == null ? null : formatProfileCount(daysTogether) },
  ].filter((row): row is { label: string; value: string } => row.value != null);

  return (
    <View style={styles.card}>
      <View style={styles.clip} />

      <View style={styles.header}>
        <View style={styles.portrait}>
          <Image source={AZO_HEAD} style={styles.portraitImage} contentFit="contain" />
        </View>
        <Text style={styles.name}>{MASCOT_NAME}</Text>
      </View>

      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.lipped,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clip: {
    position: 'absolute',
    top: -CLIP_HEIGHT / 2,
    alignSelf: 'center',
    width: CLIP_WIDTH,
    height: CLIP_HEIGHT,
    borderRadius: radius.xs,
    borderCurve: 'continuous',
    backgroundColor: colors.primary.blue500,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary.blue700,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  portrait: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    backgroundColor: colors.playful.sky.soft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  portraitImage: {
    width: PORTRAIT_SIZE - spacing.sm * 2,
    height: PORTRAIT_SIZE - spacing.sm * 2,
  },
  name: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  label: {
    ...typography.overline,
    color: colors.text.tertiary,
  },
  value: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    flexShrink: 1,
    color: colors.text.primary,
  },
});
