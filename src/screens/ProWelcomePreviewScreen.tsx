import { FullMotion } from '../hooks/useReducedMotionSetting';
import type { ProWelcomePreviewScreenProps } from '../app/navigation';
import ProWelcome from '../components/paywall/ProWelcome';
import { chosenGoalPhrase } from '../components/onboarding/data/intentOptions';

export default function ProWelcomePreviewScreen({ navigation }: ProWelcomePreviewScreenProps) {
  return (
    <FullMotion>
      <ProWelcome
        goalPhrase={chosenGoalPhrase('stress_relief', [])}
        intent="stress_relief"
        isContinuing={false}
        onContinue={() => navigation.goBack()}
      />
    </FullMotion>
  );
}
