import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const BAR_COUNT = 36;
const BAR_WIDTH = 3;
const BAR_GAP = 3;
const MIN_BAR = 3;
/** dBFS that reads as silence and as a full bar */
const QUIET_DB = -50;
const LOUD_DB = -5;

interface Props {
  /** dBFS from the recorder, roughly -60 (quiet) to 0 (loud) */
  metering: number;
  /** advances once per recorder tick, so a steady voice still scrolls */
  tick: number;
  height?: number;
  color?: string;
}

const level = (db: number) => Math.min(1, Math.max(0, (db - QUIET_DB) / (LOUD_DB - QUIET_DB)));

/** Voice Memos-style bars: each tick's loudness enters on the right and scrolls left. */
export default function VoiceWaveform({ metering, tick, height = 32, color = colors.primary.blue500 }: Props) {
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));

  useEffect(() => {
    setLevels((current) => [...current.slice(1), level(metering)]);
    // Sampled per tick rather than per change, so a held note keeps moving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return (
    <View
      accessible
      accessibilityLabel="Recording"
      style={[styles.row, { height }]}
    >
      {levels.map((value, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            { height: MIN_BAR + value * (height - MIN_BAR), backgroundColor: color },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
});
