import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PlayfulHue } from '../../features/exercise/guidedBreathing/categoryPalette';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { radius } from '../../theme/card';
import { CHUNKY_LIP_DEPTH } from '../common/ChunkyButton';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';
import TaskIllustration from '../common/icons/TaskIllustration';

const ILLUSTRATION_SIZE = 128;

interface ExploreActionCardProps {
  title: string;
  subtitle: string;
  hue: PlayfulHue;
  illustration: ComponentProps<typeof TaskIllustration>['name'];
  accessibilityLabel: string;
  accessibilityHint: string;
  onPress: () => void;
}

export default function ExploreActionCard({
  title,
  subtitle,
  hue,
  illustration,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: ExploreActionCardProps) {
  const textColor = hue.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={[styles.lip, { backgroundColor: hue.tint }]}
    >
      {({ pressed }) => (
        <View style={[
          styles.face,
          { backgroundColor: hue.soft },
          pressed && styles.facePressed,
        ]}>
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: textColor }]} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          <View style={styles.art} pointerEvents="none">
            <TaskIllustration name={illustration} size={ILLUSTRATION_SIZE} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lip: {
    width: '100%',
    aspectRatio: 0.6,
    minHeight: 280,
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    paddingBottom: CHUNKY_LIP_DEPTH,
  },
  face: {
    flex: 1,
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    padding: spacing.lg,
  },
  facePressed: {
    transform: [{ translateY: CHUNKY_LIP_DEPTH }],
  },
  textBlock: {
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 26,
  },
  subtitle: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    opacity: 0.8,
  },
});
