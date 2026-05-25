import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
  HEART_RATE_CAPTURE_MODES,
  HEART_RATE_CAPTURE_MODE_ORDER,
  isCaptureModeLocked,
  type HeartRateCaptureMode,
} from '../../lib/heartRate/captureModes';

interface CaptureModeToggleProps {
  value: HeartRateCaptureMode;
  onChange: (mode: HeartRateCaptureMode) => void;
  isPro: boolean;
}

export function CaptureModeToggle({ value, onChange, isPro }: CaptureModeToggleProps) {
  return (
    <View style={styles.toggle}>
      {HEART_RATE_CAPTURE_MODE_ORDER.map((mode) => {
        const config = HEART_RATE_CAPTURE_MODES[mode];
        const locked = isCaptureModeLocked(mode, isPro);
        const selected = mode === value;
        return (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityHint={locked ? 'Pro feature' : undefined}
            onPress={() => onChange(mode)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {config.label}
            </Text>
            {locked ? (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.background.secondary,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
  },
  segmentSelected: {
    backgroundColor: colors.background.elevated,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  labelSelected: {
    color: colors.primary.blue700,
  },
  proBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.orange[400],
  },
  proBadgeText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 9,
    letterSpacing: 0.5,
    color: colors.text.inverse,
  },
});
