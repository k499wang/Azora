import type { ProWelcomePreviewScreenProps } from '../app/navigation';
import ProWelcome from '../components/paywall/ProWelcome';
import { chosenGoalPhrase } from '../components/onboarding/data/intentOptions';

export default function ProWelcomePreviewScreen({ navigation, route }: ProWelcomePreviewScreenProps) {
  return (
    <ProWelcome
      goalPhrase={chosenGoalPhrase('stress_relief', [])}
      trialDays={route.params.trialDays}
      isContinuing={false}
      onContinue={() => navigation.goBack()}
    />
  );
}
