import { Text } from '../common/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import LockedContentBlur from '../common/LockedContentBlur';
import Icon from '../common/icons/Icon';

interface ChartInsightsSectionProps {
  accentColor: string;
  insight: string | null;
  locked: boolean;
  lockedPlaceholder: string;
  /** Card fill the locked teaser fades into — the surrounding block hue. */
  fadeColor: string;
  /** Disable the local teaser blur when the parent card supplies a full-card scrim. */
  blurLockedContent?: boolean;
  textColor?: string;
  dividerColor?: string;
}

export default function ChartInsightsSection({
  accentColor,
  insight,
  locked,
  lockedPlaceholder,
  fadeColor,
  blurLockedContent = true,
  textColor = colors.text.inverse,
  dividerColor = colors.onBlock.divider,
}: ChartInsightsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const fadeColors = [fadeColor, `${fadeColor}00`, `${fadeColor}00`, fadeColor] as const;
  const animatedHeight = useRef(new Animated.Value(300)).current;

  if (!locked && insight == null) return null;

  const toggle = () => {
    const toValue = expanded ? 0 : 300;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 450,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
    setExpanded((value) => !value);
  };

  return (
    <View style={styles.section}>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      {locked ? (
        <View style={styles.header}>
          <Icon name="sparkle" size={16} color={accentColor} />
          <Text style={[styles.title, { color: accentColor }]}>Insights</Text>
        </View>
      ) : (
        <Pressable style={styles.header} onPress={toggle}>
          <Icon name="sparkle" size={16} color={accentColor} />
          <Text style={[styles.title, { color: accentColor }]}>Insights</Text>
          <Text style={[styles.toggle, { color: textColor }]}>{expanded ? '−' : '+'}</Text>
        </Pressable>
      )}

      {locked ? (
        <View style={styles.lockedTextWrap}>
          {blurLockedContent ? (
            <LockedContentBlur locked style={styles.lockedTextContent}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Text style={[styles.text, { color: textColor }]}>{lockedPlaceholder}</Text>
              </View>
            </LockedContentBlur>
          ) : (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.lockedTextContent}
            >
              <Text style={[styles.text, { color: textColor }]}>{lockedPlaceholder}</Text>
            </View>
          )}
          {blurLockedContent ? (
            <>
              <LinearGradient
                pointerEvents="none"
                colors={fadeColors}
                locations={[0, 0.14, 0.86, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                pointerEvents="none"
                colors={fadeColors}
                locations={[0, 0.18, 0.82, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : null}
        </View>
      ) : (
        <Animated.View style={{ maxHeight: animatedHeight, overflow: 'hidden' }}>
          <Text style={[styles.text, { color: textColor }]}>{insight}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.onBlock.divider,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    flex: 1,
  },
  toggle: {
    color: colors.onBlock.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 26,
    lineHeight: 26,
  },
  lockedTextWrap: {
    minHeight: 60,
    overflow: 'hidden',
  },
  lockedTextContent: {
    minHeight: 60,
  },
  text: {
    ...typography.body.small,
    color: colors.text.inverse,
    fontFamily: fonts.regular,
    fontWeight: '400',
    lineHeight: 20,
  },
});
