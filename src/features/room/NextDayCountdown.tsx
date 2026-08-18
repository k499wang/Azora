import { useState } from 'react';
import { StyleSheet, type TextStyle } from 'react-native';
import { Text } from '../../components/common/Text';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import {
  formatCountdown,
  msUntilNextLocalDay,
} from '../../lib/room/nextDayCountdown';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * The wait, counted down.
 *
 * Every surface that says today's piece is placed showed what was coming next
 * instead, and the piece names are different lengths — the card changed height
 * from one day to the next. A clock says the same thing about coming back and
 * is the same size on every day of the room.
 */
export default function NextDayCountdown({ style }: { style?: TextStyle }) {
  const [remaining, setRemaining] = useState(() =>
    msUntilNextLocalDay(new Date()),
  );

  // A second-by-second clock is the clearest kind of wasted work when nobody is
  // looking at it, and it is stale on return either way — so it stops on blur
  // and re-reads the time on the way back rather than counting through.
  useWhileVisible(() => {
    const tick = () => setRemaining(msUntilNextLocalDay(new Date()));

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Text style={[styles.text, style]}>
      Next piece in {formatCountdown(remaining)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    // Match the metadata row text in the "Today's Dailies" card.
    ...typography.label.detail,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text.secondary,
    // Digits of even width — without this the line twitches every second.
    fontVariant: ['tabular-nums'],
  },
});
