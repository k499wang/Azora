import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { posthog } from '../../config/posthog';
import { logIdentitySyncDebug } from '../debug/identitySyncLogger.js';

type SignedInUser = {
  id: string;
  authProvider?: string | null;
};

export function bootstrapAnalytics(): void {
  const superProperties = {
    app_version: Constants.expoConfig?.version ?? null,
    analytics_env:
      (Constants.expoConfig?.extra?.analyticsEnv as string | undefined) ??
      (__DEV__ ? 'development' : 'production'),
    platform: Platform.OS,
    os_version: String(Platform.Version),
  };

  logIdentitySyncDebug('posthog.register_started', {
    posthog_distinct_id: posthog.getDistinctId(),
    super_properties: superProperties,
  });
  void posthog.register(superProperties);
  logIdentitySyncDebug('posthog.register_completed', {
    posthog_distinct_id: posthog.getDistinctId(),
    super_properties: superProperties,
  });
}

export function getCurrentPostHogDistinctId(): string | null {
  return posthog.getDistinctId() ?? null;
}

export function onUserSignedIn(user: SignedInUser): void {
  logIdentitySyncDebug('posthog.identify_started', {
    posthog_distinct_id_before: getCurrentPostHogDistinctId(),
    posthog_target_user_id: user.id,
    posthog_target_provider: user.authProvider ?? null,
  });

  posthog.identify(user.id, {
    $set: {
      auth_provider: user.authProvider ?? null,
    },
    $set_once: {
      signup_date: new Date().toISOString(),
    },
  });

  logIdentitySyncDebug('posthog.identify_completed', {
    posthog_distinct_id_after: getCurrentPostHogDistinctId(),
    posthog_target_user_id: user.id,
  });
}

export function onUserSignedOut(): void {
  logIdentitySyncDebug('posthog.reset_started', {
    posthog_distinct_id_before: getCurrentPostHogDistinctId(),
  });
  posthog.reset();
  logIdentitySyncDebug('posthog.reset_completed', {
    posthog_distinct_id_after: getCurrentPostHogDistinctId(),
  });
}
