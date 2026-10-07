import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { RiseUnlessReducedMotion } from '../../components/common/Reveal';
import ScreenContent from '../../components/common/ScreenContent';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ActivityRewardHero, { type RewardPose } from './ActivityRewardHero';
import { REWARD_BEAT, rewardHeroWidth } from './rewardEntrance';

interface ActivityCompletionContentProps {
  title: string;
  subtitle: string;
  pose?: RewardPose;
  hero?: ReactNode;
  children?: ReactNode;
}

/** Shared Azo presentation; each activity owns its results and actions, and their entrance. */
export default function ActivityCompletionContent({
  title,
  subtitle,
  pose = 'celebrating',
  hero,
  children,
}: ActivityCompletionContentProps) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  return (
    <ScreenContent style={styles.body}>
      {hero ?? (
        <ActivityRewardHero
          maxWidth={rewardHeroWidth(width, height)}
          pose={pose}
          delay={REWARD_BEAT.hero}
          reducedMotion={reducedMotion}
        />
      )}
      <RiseUnlessReducedMotion delay={REWARD_BEAT.title} reducedMotion={reducedMotion}>
        <Text style={styles.title}>{title}</Text>
      </RiseUnlessReducedMotion>
      <RiseUnlessReducedMotion delay={REWARD_BEAT.subtitle} reducedMotion={reducedMotion}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </RiseUnlessReducedMotion>
      {children != null && <View style={styles.card}>{children}</View>}
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  card: {
    marginTop: spacing.lg,
  },
});
