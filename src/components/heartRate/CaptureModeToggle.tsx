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
  /** Called when a Pro-only mode is tapped by a non-Pro user (e.g. to open the paywall). */
  onLockedPress?: (mode: HeartRateCaptureMode) => void;
}

export function CaptureModeToggle({
  value,
  onChange,
  isPro,
  onLockedPress,
}: CaptureModeToggleProps) {
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
            onPress={() => (locked ? onLockedPress?.(mode) : onChange(mode))}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            {locked ? (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            ) : null}
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {config.label}
            </Text>
            <Text style={[styles.subLabel, selected && styles.subLabelSelected]}>
              {config.shortDescription}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.elevated,
  },
  segmentSelected: {
    borderColor: colors.primary.blue600,
    backgroundColor: colors.primary.blue100,
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  labelSelected: {
    color: colors.primary.blue700,
  },
  subLabel: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  subLabelSelected: {
    color: colors.primary.blue600,
  },
  proBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
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
