import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import { DAYS, DecorationTile, type DayKey } from '../../features/room/RoomScene';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { RoomDecorationRow } from '../../services/room/roomService';

const TILE_WIDTH = 84;

function decorationName(slot: string, optionId: string): string | null {
  const day = DAYS.find((entry) => entry.key === slot);
  return day?.options.find((option) => option.id === optionId)?.name ?? null;
}

interface Props {
  decoration: RoomDecorationRow;
}

export default function HistoryEarnedCard({ decoration }: Props) {
  const name = decorationName(decoration.slot, decoration.optionId);
  if (name == null) return null;

  return (
    <View style={[card.base, card.shadow, styles.card]}>
      <View style={styles.tile}>
        <DecorationTile
          day={decoration.slot as DayKey}
          option={decoration.optionId}
          width={TILE_WIDTH}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.caption}>Added to your room</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  tile: {
    width: TILE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  name: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  caption: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
});
