import { useState } from 'react';
import { View } from 'react-native';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import type { MindMapScore } from '../../../lib/onboardingScores';
import { personalizedPaywallPlan } from '../../../lib/paywall/paywallLongForm';
import { PaywallPlanProgressCard } from '../../paywall/PaywallPlanProgressCard';
import { Text } from '../../common/Text';
import type { OnboardingIntent } from '../types';
import { paywallStepStyles as styles } from './paywallStepStyles';

export function PaywallFreeTrialHeroStep({
  planPreset,
  intent = 'other',
  name,
  goalPhrase,
  scores,
}: {
  planPreset: OnboardingPreset;
  intent?: OnboardingIntent;
  name?: string;
  goalPhrase?: string | null;
  scores?: MindMapScore[];
}) {
  const [today] = useState(() => new Date());
  const plan = personalizedPaywallPlan(planPreset, intent, name, goalPhrase, today);

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {`We want you to try your ${plan.planName} plan `}
          <Text style={styles.stepTitleBrand}>for free!</Text>
        </Text>
      </View>
      {scores != null && scores.length > 0 ? (
        <PaywallPlanProgressCard scores={scores} finishDate={plan.finishDate} />
      ) : null}
    </View>
  );
}

export default PaywallFreeTrialHeroStep;
