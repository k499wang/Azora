import { useCallback, useState, type ReactNode } from 'react';
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
  entrance?: 'staggered' | 'together';
  onReady?: () => void;
}

/** Shared Azo presentation; each activity owns its results and actions, and their entrance. */
export default function ActivityCompletionContent({
  title,
  subtitle,
  pose = 'celebrating',
  hero,
  children,
  entrance = 'staggered',
  onReady,
}: ActivityCompletionContentProps) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [heroReady, setHeroReady] = useState(false);
  const handleHeroReady = useCallback(() => {
    setHeroReady(true);
    onReady?.();
  }, [onReady]);
  const together = entrance === 'together';
  const ready = !together || hero != null || heroReady;

  return (
    <ScreenContent style={styles.body}>
      {hero ?? (
        <ActivityRewardHero
          maxWidth={rewardHeroWidth(width, height)}
          pose={pose}
          delay={together ? 0 : REWARD_BEAT.hero}
          reducedMotion={reducedMotion}
          onReady={together ? handleHeroReady : undefined}
        />
      )}
      <RiseUnlessReducedMotion
        delay={together ? 0 : REWARD_BEAT.title}
        when={ready}
        reducedMotion={reducedMotion}
        style={!ready && reducedMotion ? styles.waiting : undefined}
      >
        <Text style={styles.title}>{title}</Text>
      </RiseUnlessReducedMotion>
      <RiseUnlessReducedMotion
        delay={together ? 0 : REWARD_BEAT.subtitle}
        when={ready}
        reducedMotion={reducedMotion}
        style={!ready && reducedMotion ? styles.waiting : undefined}
      >
        <Text style={styles.subtitle}>{subtitle}</Text>
      </RiseUnlessReducedMotion>
      {children != null && <View style={styles.card}>{children}</View>}
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
  waiting: { opacity: 0 },
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
