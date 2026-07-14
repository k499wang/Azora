import { Text } from '../common/Text';
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
}

export default function ChartInsightsSection({
  accentColor,
  insight,
  locked,
  lockedPlaceholder,
}: ChartInsightsSectionProps) {
  const [expanded, setExpanded] = useState(true);
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
      <View style={styles.divider} />
      {locked ? (
        <View style={styles.header}>
          <Icon name="sparkle" size={16} color={accentColor} />
          <Text style={[styles.title, { color: accentColor }]}>Insights</Text>
        </View>
      ) : (
        <Pressable style={styles.header} onPress={toggle}>
          <Icon name="sparkle" size={16} color={accentColor} />
          <Text style={[styles.title, { color: accentColor }]}>Insights</Text>
          <Text style={styles.toggle}>{expanded ? '−' : '+'}</Text>
        </Pressable>
      )}

      {locked ? (
        <LockedContentBlur locked style={styles.lockedTextWrap}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.text}>{lockedPlaceholder}</Text>
          </View>
        </LockedContentBlur>
      ) : (
        <Animated.View style={{ maxHeight: animatedHeight, overflow: 'hidden' }}>
          <Text style={styles.text}>{insight}</Text>
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
    backgroundColor: colors.neutral[200],
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
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    fontSize: 26,
    lineHeight: 26,
  },
  lockedTextWrap: {
    minHeight: 60,
  },
  text: {
    ...typography.body.small,
    color: colors.text.primary,
    fontFamily: fonts.regular,
    fontWeight: '400',
    lineHeight: 20,
  },
});
