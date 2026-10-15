import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { decorationRewardPalette } from './decorationRewardPalette';
import { useHomeDayCompleteHandoff } from './homeDayCompleteHandoff';

const COVER_DEADLINE_MS = 1500;

/**
 * The gift's field, held over the app while a finished day closes onto Home.
 *
 * The handing screen leaves at once, and the gift presents a few frames later;
 * without this, Home shows through in between. It lifts when Home takes the
 * handoff, and on a deadline so a gift that never comes cannot strand it.
 */
export default function DayCompleteCover() {
  const covering = useHomeDayCompleteHandoff(
    (state) => state.stage === 'ready' && state.over,
  );
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setExpired(false);
    if (!covering) return;
    const deadline = setTimeout(() => setExpired(true), COVER_DEADLINE_MS);
    return () => clearTimeout(deadline);
  }, [covering]);

  if (!covering || expired) return null;
  return <View pointerEvents="none" style={styles.cover} />;
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: decorationRewardPalette.field,
  },
});
