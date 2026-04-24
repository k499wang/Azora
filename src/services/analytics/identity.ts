import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { posthog } from '../../config/posthog';

type SignedInUser = {
  id: string;
  email?: string | null;
  authProvider?: string | null;
};

export function bootstrapAnalytics(): void {
  posthog.register({
    app_version: Constants.expoConfig?.version ?? null,
    platform: Platform.OS,
    os_version: String(Platform.Version),
  });
}

export function onUserSignedIn(user: SignedInUser): void {
  posthog.identify(user.id, {
    $set: {
      email: user.email ?? null,
      auth_provider: user.authProvider ?? null,
    },
    $set_once: {
      signup_date: new Date().toISOString(),
    },
  });
}

export function onUserSignedOut(): void {
  posthog.reset();
}
