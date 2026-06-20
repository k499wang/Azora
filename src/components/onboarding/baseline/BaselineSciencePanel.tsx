import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  const [contentHeight, setContentHeight] = useState(0);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: open ? contentHeight : 0,
        duration: open ? 320 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(contentAnim, {
        toValue: open ? 1 : 0,
        duration: open ? 220 : 140,
        delay: open ? 60 : 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentAnim, contentHeight, heightAnim, open]);

  const contentTranslateY = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

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

      <View style={styles.scienceMeasure} pointerEvents="none" aria-hidden>
        <ScienceBody
          onLayoutHeight={(height) => {
            if (height > 0 && Math.abs(height - contentHeight) > 0.5) {
              setContentHeight(height);
            }
          }}
        />
      </View>

      <Animated.View
        style={[
          styles.scienceBodyClip,
          { height: heightAnim },
        ]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <Animated.View
          style={[
            styles.scienceBodyInner,
            {
              opacity: contentAnim,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <ScienceBody />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export default BaselineSciencePanel;

interface ScienceBodyProps {
  onLayoutHeight?: (height: number) => void;
}

function ScienceBody({ onLayoutHeight }: ScienceBodyProps) {
  return (
    <View
      style={styles.sciencePanel}
      onLayout={
        onLayoutHeight
          ? (event) => onLayoutHeight(event.nativeEvent.layout.height)
          : undefined
      }
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
  scienceMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
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
