import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

// Shows Apple's ATT dialog exactly once (only while still undetermined), and
// never on Android/web. AppsFlyer's init holds its install postback for
// `timeToWaitForATTUserAuthorization` seconds so the result is captured.
export async function requestAttPermissionOnce(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const current = await getTrackingPermissionsAsync();
    if (current.status !== 'undetermined') return;
    await requestTrackingPermissionsAsync();
  } catch {
    // Never block onboarding on ATT.
  }
}

export async function isAttPermissionResolved(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;
  try {
    const current = await getTrackingPermissionsAsync();
    return current.status !== 'undetermined';
  } catch {
    return true;
  }
}
