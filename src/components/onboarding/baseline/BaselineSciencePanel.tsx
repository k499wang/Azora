import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';

const SCIENCE_BODY_TEXT =
  'When you cover the back camera with your fingertip, the flash lights your skin from the inside. Each heartbeat pushes a small wave of blood through the capillaries, changing how much light reflects back into the lens. We sample those brightness shifts about 30 times a second — the same optical method clinical pulse oximeters use — and turn them into your BPM.';

export function BaselineSciencePanel() {
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: open ? 300 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, progress]);

  const clipStyle = useAnimatedStyle(() => ({
    height: progress.value * contentHeight.value,
  }));

  const innerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -8 }],
  }));

  const toggleOpen = () => {
    setOpen((value) => !value);
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
  };

  return (
    <View style={styles.scienceWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggleOpen}
        style={({ pressed }) => [
          styles.scienceButton,
          pressed && styles.scienceButtonPressed,
        ]}
      >
        <View style={styles.scienceButtonIcon}>
          <Icon name="microscope" size={16} color={colors.primary.blue700} />
        </View>
        <Text style={styles.scienceButtonLabel}>How it works</Text>
        <Text style={styles.scienceButtonChevron}>{open ? '−' : '+'}</Text>
      </Pressable>

      <Animated.View
        style={[styles.scienceBodyClip, clipStyle]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <Animated.View style={[styles.scienceBodyInner, innerStyle]}>
          <ScienceBody
            onLayoutHeight={(height) => {
              contentHeight.value = height;
            }}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export default BaselineSciencePanel;

interface ScienceBodyProps {
  onLayoutHeight: (height: number) => void;
}

function ScienceBody({ onLayoutHeight }: ScienceBodyProps) {
  return (
    <View
      style={styles.sciencePanel}
      onLayout={(event) => onLayoutHeight(event.nativeEvent.layout.height)}
    >
      <View style={styles.sciencePanelHeader}>
        <View style={styles.scienceButtonIcon}>
          <Icon name="microscope" size={14} color={colors.primary.blue700} />
        </View>
        <Text style={styles.sciencePanelLabel}>Photoplethysmography</Text>
      </View>
      <Text style={styles.scienceBody}>{SCIENCE_BODY_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scienceWrap: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  scienceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: colors.background.accentSoft,
    borderWidth: 1,
    borderColor: colors.primary.blue100,
  },
  scienceButtonPressed: {
    opacity: 0.7,
  },
  scienceButtonIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scienceButtonLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue700,
    letterSpacing: -0.1,
  },
  scienceButtonChevron: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: colors.primary.blue700,
    marginLeft: 2,
  },
  scienceBodyClip: {
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  scienceBodyInner: {
    alignSelf: 'stretch',
  },
  sciencePanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.background.accentSoft,
    borderWidth: 1,
    borderColor: colors.primary.blue100,
  },
  sciencePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sciencePanelLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  scienceBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
