import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import OnboardingSummaryCard, {
  OnboardingSummaryPill,
} from '../OnboardingSummaryCard';
import MindMapRadar from '../MindMapRadar';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import MochiAside from '../MochiAside';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import type { MindMapAxis, MindMapScore } from '../../../lib/onboardingScores';
import { ONBOARDING_VISUAL_MAX_WIDTH } from '../onboardingVisualScale';

interface DiagnosisScreenProps {
  scores: MindMapScore[];
  superpower: MindMapScore;
  growthArea: MindMapScore;
  restingBpm: number | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

interface HighlightCard {
  id: string;
  role: string;
  subject?: string;
  pill: string;
  pillColor: string;
  body: string;
}

function HighlightCardList({ items }: { items: HighlightCard[] }) {
  return (
    <View style={styles.highlightList}>
      {items.map((item) => (
        <OnboardingSummaryCard
          key={item.id}
          title={item.role}
          subject={item.subject}
          body={item.body}
          trailing={
            <OnboardingSummaryPill label={item.pill} color={item.pillColor} />
          }
        />
      ))}
    </View>
  );
}

const SUPERPOWER_COPY: Record<MindMapAxis, string> = {
  calm: 'Traffic at a standstill? Your body settles before your head does.',
  recovery: 'Long day behind you? You come back down faster than most people.',
  focus: 'Deep work in front of you? You drop in and stay there.',
  resilience: 'Plans fall apart? You steady yourself and keep moving.',
  breathEase: 'Your breath already runs slow and easy without you thinking about it.',
};

const GROWTH_COPY: Record<MindMapAxis, string> = {
  calm: 'Tense moment passes? The tension tends to stay with you long after.',
  recovery: 'Rest is not landing yet. Your body is still running warm at night.',
  focus: 'Halfway through a task and gone? Your attention is asking for a reset.',
  resilience: 'Small things going wrong? They are landing harder than you would like.',
  breathEase: 'Your breathing is running shallow and quick through most of the day.',
};

export default function DiagnosisScreen({
  scores,
  superpower,
  growthArea,
  restingBpm,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: DiagnosisScreenProps) {
  const { width } = useWindowDimensions();

  const highlights = useMemo<HighlightCard[]>(() => {
    return [
      {
        id: 'superpower',
        role: 'Superpower',
        subject: superpower.label,
        pill: `${Math.round(superpower.value)}%`,
        pillColor: colors.success[500],
        body: SUPERPOWER_COPY[superpower.axis],
      },
      {
        id: 'growth',
        role: 'Growth area',
        subject: growthArea.label,
        pill: `${Math.round(growthArea.value)}%`,
        pillColor: colors.orange[500],
        body: GROWTH_COPY[growthArea.axis],
      },
    ];
  }, [growthArea, superpower]);

  const measurements = useMemo<HighlightCard[]>(() => {
    const next: HighlightCard[] = [];

    if (restingBpm != null) {
      next.push({
        id: 'resting-bpm',
        role: 'Resting heart rate',
        pill: `${Math.round(restingBpm)} BPM`,
        pillColor: colors.primary.blue600,
        body: 'Measured from your fingertip during onboarding.',
      });
    }

    return next;
  }, [restingBpm]);

  return (
    <OnboardingScreenLayout
      title="Your Azora profile"
      progress={stepIndex / stepCount}
      onBack={onBack}
      titleStyle={styles.screenTitle}
      centerCopy
      footer={<OnboardingPrimaryButton label="See my plan" onPress={onContinue} />}
    >
      <View style={styles.page}>
        <View style={styles.radarWrap}>
          <MindMapRadar scores={scores} size={Math.min(width, ONBOARDING_VISUAL_MAX_WIDTH)} />
        </View>

        <Text style={styles.summary}>
          <Text style={styles.summaryStrong}>{superpower.label}</Text>
          {' is your strongest dimension. '}
          <Text style={styles.summaryGrowth}>{growthArea.label}</Text>
          {' has the most room to move.'}
        </Text>

        <View style={styles.speech}>
          <MochiAside
            text="Here are your highlights:"
            variant="heading"
            expression="pleased"
            holding="notes"
          />
        </View>

        <HighlightCardList items={highlights} />

        {measurements.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Your measurements</Text>
            <HighlightCardList items={measurements} />
          </>
        ) : null}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
  page: {
    gap: spacing.sm,
  },
  radarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.lg,
  },
  summary: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  summaryStrong: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
  },
  summaryGrowth: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.orange[600],
  },
  speech: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  highlightList: {
    gap: spacing.sm,
  },
});
