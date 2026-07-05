import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  isAvailable as isTrackingTransparencyAvailable,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

export type AttPermissionResolution = 'resolved' | 'undetermined' | 'error';

let hasResolvedAttThisSession = Platform.OS !== 'ios';

function toResolution(status: string): AttPermissionResolution {
  if (status !== 'undetermined') {
    hasResolvedAttThisSession = true;
    return 'resolved';
  }
  return 'undetermined';
}

function handleTrackingTransparencyError(error: unknown): AttPermissionResolution {
  if (!isTrackingTransparencyAvailable()) {
    hasResolvedAttThisSession = true;
    return 'resolved';
  }
  console.warn('[appsflyer] Could not read ATT status; AppsFlyer start will retry.', error);
  return hasResolvedAttThisSession ? 'resolved' : 'error';
}

// Shows Apple's ATT dialog exactly once (only while still undetermined), and
// never on Android/web. AppsFlyer starts after this resolves so Meta receives a
// valid Advertiser Tracking Enabled state.
export async function requestAttPermissionOnce(): Promise<AttPermissionResolution> {
  if (Platform.OS !== 'ios') return 'resolved';
  try {
    const current = await getTrackingPermissionsAsync();
    if (current.status !== 'undetermined') {
      return toResolution(current.status);
    }
    const next = await requestTrackingPermissionsAsync();
    return toResolution(next.status);
  } catch (error) {
    // Never block onboarding on ATT.
    return handleTrackingTransparencyError(error);
  }
}

export async function getAttPermissionResolution(): Promise<AttPermissionResolution> {
  if (Platform.OS !== 'ios' || hasResolvedAttThisSession) return 'resolved';
  try {
    const current = await getTrackingPermissionsAsync();
    return toResolution(current.status);
  } catch (error) {
    return handleTrackingTransparencyError(error);
  }
}

export async function isAttPermissionResolved(): Promise<boolean> {
  return (await getAttPermissionResolution()) === 'resolved';
}
