import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { RoutineLibraryEntry, RoutineLibraryId } from '../../data/routineLibrary';
import {
  getRoutineLibraryImageSource,
  type RoutineCoverId,
} from '../../services/images/routineLibraryImageCache';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const TONES = {
  sky: colors.playful.sky,
  teal: colors.playful.teal,
  amber: colors.playful.amber,
  violet: colors.playful.violet,
  coral: colors.playful.coral,
} as const;

const TEMPLATE_COVER_IDS = new Set<RoutineCoverId>([
  'morning-reset',
  'focus-reset',
  'evening-wind-down',
  'bedtime-routine',
  'weekly-home-reset',
  'small-clean',
]);

function isRoutineCoverId(id: RoutineLibraryId): id is RoutineCoverId {
  return TEMPLATE_COVER_IDS.has(id as RoutineCoverId);
}

interface RoutineLibraryArtProps {
  entry: RoutineLibraryEntry;
  size: 'card' | 'hero';
}

/** A visible photo placeholder until the library receives its own cover art. */
export default function RoutineLibraryArt({ entry, size }: RoutineLibraryArtProps) {
  const tone = TONES[entry.tone];
  const hero = size === 'hero';
  const cover = entry.kind === 'template' && isRoutineCoverId(entry.id)
    ? getRoutineLibraryImageSource(entry.id)
    : null;

  if (cover != null) {
    return (
      <Image
        source={cover}
        contentFit="cover"
        style={[styles.art, hero ? styles.hero : styles.card]}
      />
    );
  }

  return (
    <LinearGradient
      colors={[tone.soft, tone.tint, tone.base]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.art, hero ? styles.hero : styles.card]}
    >
      <View style={[styles.glow, { backgroundColor: tone.base }]} />
      <View style={styles.placeholder}>
        <Icon name={entry.icon} size={hero ? 58 : 38} color={tone.ink} />
        <Text style={[styles.placeholderLabel, { color: tone.ink }]}>Photo placeholder</Text>
      </View>
    </LinearGradient>
  );
}

const CARD_ASPECT = 4 / 3;

const styles = StyleSheet.create({
  art: { overflow: 'hidden', borderRadius: radius.card, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  card: { aspectRatio: CARD_ASPECT },
  hero: { height: 280 },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, opacity: 0.18, right: -74, bottom: -112 },
  placeholder: { alignItems: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radius.medium, backgroundColor: colors.background.card },
  placeholderLabel: { ...typography.label.small, fontFamily: fonts.semibold },
});
