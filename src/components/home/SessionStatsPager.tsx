import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import RingStatCard from './RingStatCard';
import HRVChart from './HRVChart';

interface SessionStatsPagerProps {
  ibiMs?: number[];
}

const DEFAULT_IBI_MS: number[] = [
  790, 812, 835, 818, 802, 845, 870, 858, 832, 880,
  905, 892, 915, 940, 928, 952, 975, 962, 985, 1010,
  998, 1025, 1048, 1032, 1018, 1045, 1062,
];

export default function SessionStatsPager({ ibiMs = DEFAULT_IBI_MS }: SessionStatsPagerProps) {
  return (
    <View style={styles.page}>
      <View style={styles.smallRingsRow}>
        <RingStatCard
          label="BPM"
          value="62"
          target="60"
          progress={0.48}
          color={colors.error[500]}
          trackColor={colors.neutral[200]}
          icon="heart-pulse"
        />
        <RingStatCard
          label="Hold"
          value="1:42"
          target="2:00"
          progress={0.72}
          color={colors.primary.blue500}
          trackColor={colors.neutral[200]}
          icon="timer-sand"
        />
        <RingStatCard
          label="Health"
          value="92"
          target="100"
          progress={0.92}
          color={colors.success[500]}
          trackColor={colors.neutral[200]}
          icon="heart-plus"
        />
      </View>
      <HRVChart ibiMs={ibiMs} color={colors.error[500]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
  },
  smallRingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
