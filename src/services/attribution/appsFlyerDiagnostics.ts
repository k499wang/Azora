import { Platform } from 'react-native';
import { getAppsFlyerAppId, getAppsFlyerDevKey } from './appsFlyerConfig';
import { getAppsFlyerAvailability, getAppsFlyerId } from './appsFlyerClient';

// Dev-only one-shot summary so a single console line answers "is AppsFlyer
// configured correctly on this build?" without digging through native logs.
// Call after initAppsFlyer() resolves.
export async function logAppsFlyerDiagnostics(): Promise<void> {
  if (!__DEV__) return;

  const availability = getAppsFlyerAvailability();
  const devKey = getAppsFlyerDevKey();
  const resolvedAppId =
    Platform.OS === 'ios'
      ? (getAppsFlyerAppId() ?? '').replace(/^id/i, '') || '(missing)'
      : '(n/a — android)';

  const status =
    availability.status === 'ready' ? 'ready' : `unavailable:${availability.reason}`;

  console.log(
    `[appsflyer-diag] availability=${status} devKey=${devKey ? 'present' : 'MISSING'} ` +
      `appId=${resolvedAppId} platform=${Platform.OS}`,
  );

  if (availability.status !== 'ready') {
    console.log(
      '[appsflyer-diag] not ready — SDK is a no-op. Fix config/platform before testing attribution.',
    );
    return;
  }

  const appsFlyerId = await getAppsFlyerId();
  console.log(
    `[appsflyer-diag] appsFlyerId=${appsFlyerId ?? 'null (init not finished?)'}`,
  );
  console.log(
    '[appsflyer-diag] CUID is set on sign-in — look for "[appsflyer-diag] cuid set" after auth.',
  );
}
