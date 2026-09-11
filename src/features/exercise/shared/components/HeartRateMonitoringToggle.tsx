import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../../components/common/Text';
import Icon from '../../../../components/common/icons/Icon';
import { radius } from '../../../../theme/card';
import { spacing } from '../../../../theme/spacing';
import { fonts, typography } from '../../../../theme/typography';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';

interface Props {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  theme: ExerciseDarkTheme;
  proLocked?: boolean;
}

export default function HeartRateMonitoringToggle({
  enabled,
  onToggle,
  theme,
  proLocked = false,
}: Props) {
  const press = () => {
    if (isHapticsEnabled())
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle(!enabled);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      accessibilityLabel="Heart rate monitoring"
      onPress={press}
      hitSlop={8}
      style={({ pressed }) => [
        styles.block,
        {
          backgroundColor: theme.controlSurface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.labelRow}>
        {proLocked ? (
          <Icon name="lock" size={17} color={theme.textPrimary} />
        ) : null}
        <Text style={[styles.caption, { color: theme.textPrimary }]}>
          Heart rate monitoring
        </Text>
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: enabled ? theme.textAccent : theme.controlBorder,
            alignItems: enabled ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <View style={[styles.knob, { backgroundColor: theme.controlSurface }]} />
      </View>
    </Pressable>
  );
}

const TRACK_WIDTH = 56;
const TRACK_HEIGHT = 32;
const KNOB_SIZE = 26;

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    // The intro block's own gap sits the description close to whatever follows
    // it; this control reads as a separate setting, not a third line of copy.
    marginTop: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  caption: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
  },
});
