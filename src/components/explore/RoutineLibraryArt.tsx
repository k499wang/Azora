import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { RoutineLibraryEntry } from '../../data/routineLibrary';
import {
  getRoutineLibraryImageSource,
  type RoutineCoverId,
} from '../../services/images/routineLibraryImageCache';
import TaskIllustration from '../common/icons/TaskIllustration';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';

const TONES = {
  sky: colors.playful.sky,
  teal: colors.playful.teal,
  amber: colors.playful.amber,
  violet: colors.playful.violet,
  coral: colors.playful.coral,
} as const;

const HERO_POSTER_MAX_WIDTH = 320;

interface RoutineLibraryArtProps {
  entry: RoutineLibraryEntry;
  size: 'card' | 'hero' | 'poster';
}

/** The routine's poster, or an illustration on a tinted ground for a guide with none. */
export default function RoutineLibraryArt({ entry, size }: RoutineLibraryArtProps) {
  const tone = TONES[entry.tone];
  const hero = size === 'hero';
  const sizeStyle = styles[size];
  const cover = entry.kind === 'template'
    ? getRoutineLibraryImageSource(entry.id as RoutineCoverId)
    : null;

  if (cover != null) {
    return (
      <Image
        source={cover}
        cachePolicy="memory-disk"
        contentFit="cover"
        style={[styles.art, hero ? styles.heroPoster : sizeStyle]}
        transition={0}
      />
    );
  }

  return (
    <LinearGradient
      colors={[tone.soft, tone.tint, tone.base]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.art, sizeStyle]}
    >
      <View style={[styles.glow, { backgroundColor: tone.base }]} />
      <TaskIllustration name={entry.icon} size={hero ? 160 : 96} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  art: { overflow: 'hidden', borderRadius: radius.card, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  card: { height: 240 },
  hero: { height: 280 },
  poster: { width: '100%', aspectRatio: 2 / 3 },
  heroPoster: { width: '72%', maxWidth: HERO_POSTER_MAX_WIDTH, aspectRatio: 2 / 3, alignSelf: 'center' },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, opacity: 0.18, right: -74, bottom: -112 },
});
