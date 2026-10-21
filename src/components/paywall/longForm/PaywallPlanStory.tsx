import type { MindMapScore } from '../../../lib/onboardingScores';
import type { personalizedPaywallPlan } from '../../../lib/paywall/paywallLongForm';
import { PaywallPlanJourney } from '../PaywallPlanJourney';
import { PaywallPlanProgressCard } from '../PaywallPlanProgressCard';
import { PaywallSection } from './PaywallSection';

interface PaywallPlanStoryProps {
  plan: ReturnType<typeof personalizedPaywallPlan>;
  scores?: MindMapScore[];
  showChangeTitle?: boolean;
}

/** The same assessment and projection as onboarding, followed by the plan's milestones. */
export function PaywallPlanStory({ plan, scores, showChangeTitle = true }: PaywallPlanStoryProps) {
  return (
    <>
      {scores != null && scores.length > 0 ? (
        <PaywallSection title={showChangeTitle ? 'See the change you’re working toward' : undefined}>
          <PaywallPlanProgressCard scores={scores} finishDate={plan.finishDate} />
        </PaywallSection>
      ) : null}

      <PaywallPlanJourney plan={plan} />
    </>
  );
}
