import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card, coloredCard } from '../../theme/card';
import ActivityGlyph from '../explore/ActivityGlyph';
import type {
  GlyphShape,
  PlayfulHue,
} from '../../features/exercise/guidedBreathing/categoryPalette';
import {
  addProfileValueBreakOpportunities,
  formatProfileCount,
  formatProfileDuration,
} from '../../lib/profileStatsFormat';

const TILE_HEIGHT = 140;
const GLYPH_SIZE = 96;
const STAT_VALUE_LINE_HEIGHT = 38;

interface ProfileLifetimeStatsRowProps {
  totalBreaths: number;
  totalSessions: number;
  totalHoldSeconds: number;
}

interface LifetimeStat {
  label: string;
  value: string;
  hue: PlayfulHue;
  glyph: GlyphShape;
}

export default function ProfileLifetimeStatsRow({
  totalBreaths,
  totalSessions,
  totalHoldSeconds,
}: ProfileLifetimeStatsRowProps) {
  const stats: LifetimeStat[] = [
    {
      label: 'Breaths',
      value: formatProfileCount(totalBreaths),
      hue: colors.playful.teal,
      glyph: 'waves',
    },
    {
      label: 'Sessions',
      value: formatProfileCount(totalSessions),
      hue: colors.playful.violet,
      glyph: 'petals',
    },
    {
      label: 'Time held',
      value: formatProfileDuration(totalHoldSeconds),
      hue: colors.playful.amber,
      glyph: 'bars',
    },
  ];

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.tileShadow}>
          <View style={[styles.tile, coloredCard(stat.hue)]}>
            <View style={styles.tileGlyph} pointerEvents="none">
              <ActivityGlyph
                shape={stat.glyph}
                size={GLYPH_SIZE}
                color={colors.text.inverse}
                opacity={0.16}
              />
            </View>

            <View style={styles.tileContent}>
              <Text
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {stat.label}
              </Text>
              <View style={styles.statValueSlot}>
                <Text
                  style={styles.statValue}
                  accessibilityLabel={stat.value}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {addProfileValueBreakOpportunities(stat.value)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tileShadow: {
    ...card.blockShadow,
    flex: 1,
  },
  tile: {
    ...card.block,
    height: TILE_HEIGHT,
  },
  tileGlyph: {
    position: 'absolute',
    right: -30,
    bottom: -34,
  },
  tileContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  statLabel: {
    ...typography.title.title3,
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 26,
    color: colors.text.inverse,
  },
  // iOS shrinks an `adjustsFontSizeToFit` line to the height it is given as
  // well as the width, so a two-line value in an auto-height box is measured
  // against whatever space happens to be left and comes out far below its
  // minimum scale. Two lines of the drawn size is the box it is allowed to fill.
  statValueSlot: {
    height: STAT_VALUE_LINE_HEIGHT * 2,
    justifyContent: 'flex-end',
  },
  statValue: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontSize: 32,
    lineHeight: STAT_VALUE_LINE_HEIGHT,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    color: colors.text.inverse,
  },
});
