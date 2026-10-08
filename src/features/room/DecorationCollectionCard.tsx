import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ChunkyButton, { CHUNKY_TONE } from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import { buildDecorationCollection, type CollectionEntry, type CollectionTile } from '../../lib/room/decorationCollection';
import type { OwnedObject } from '../../lib/room/inventory';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { DAYS, type DayKey } from './RoomScene';
import { DecorationSolo } from './roomStage';

const COLUMNS = 3;
const TILE_COUNT = 6;
const DECORATION_SIZE = 64;
const RING_COUNT = 5;
const RING_SIZE = 14;

type CatalogEntry = CollectionEntry & { day: DayKey };

const CATALOG: CatalogEntry[] = DAYS.flatMap((day) =>
  day.options.map((option) => ({ day: day.key, optionId: option.id, name: option.name })),
);

interface DecorationCollectionCardProps {
  owned: readonly OwnedObject[];
  onOpen: () => void;
}

export default function DecorationCollectionCard({ owned, onOpen }: DecorationCollectionCardProps) {
  const collection = useMemo(() => buildDecorationCollection(CATALOG, owned, TILE_COUNT), [owned]);
  const rows = Array.from({ length: Math.ceil(collection.tiles.length / COLUMNS) }, (_, index) =>
    collection.tiles.slice(index * COLUMNS, (index + 1) * COLUMNS),
  );

  return (
    <View style={styles.card}>
      <View style={styles.rings}>
        {Array.from({ length: RING_COUNT }, (_, index) => (
          <View key={index} style={styles.ring} />
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row[0].key} style={styles.gridRow}>
            {row.map((tile) => (
              <CollectionTileView key={tile.key} tile={tile} />
            ))}
            {Array.from({ length: COLUMNS - row.length }, (_, index) => (
              <View key={index} style={styles.tile} />
            ))}
          </View>
        ))}
      </View>

      <ChunkyButton
        label={`${collection.ownedCount} / ${collection.total}`}
        onPress={onOpen}
        shape="card"
        tone={CHUNKY_TONE}
        haptic="tap"
        minHeight={44}
        trailingIcon={<Icon name="chevron-right" size={18} color={CHUNKY_TONE.label} />}
      />
    </View>
  );
}

function CollectionTileView({ tile }: { tile: CollectionTile<CatalogEntry> }) {
  if (tile.kind === 'locked') {
    return (
      <View style={styles.tile}>
        <View style={[styles.well, styles.lockedWell]}>
          <Text style={styles.lockedMark}>?</Text>
        </View>
        <Text style={[styles.tileName, styles.lockedName]}>???</Text>
      </View>
    );
  }

  return (
    <View style={styles.tile}>
      <View style={[styles.well, styles.ownedWell]}>
        <DecorationSolo
          width={DECORATION_SIZE}
          height={DECORATION_SIZE}
          day={tile.entry.day}
          option={tile.entry.optionId}
        />
      </View>
      <Text style={styles.tileName} numberOfLines={1}>
        {tile.entry.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.lipped,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  rings: {
    position: 'absolute',
    top: -RING_SIZE / 2,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.primary.blue500,
    backgroundColor: colors.background.canvas,
  },
  grid: {
    gap: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'center',
  },
  well: {
    alignSelf: 'stretch',
    aspectRatio: 1,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedWell: {
    backgroundColor: colors.playful.sky.soft,
  },
  lockedWell: {
    backgroundColor: colors.neutral[100],
  },
  lockedMark: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.neutral[300],
  },
  tileName: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  lockedName: {
    color: colors.text.tertiary,
  },
});
