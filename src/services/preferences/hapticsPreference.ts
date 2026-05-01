import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_ENABLED_KEY = 'settings:haptics_enabled';

let hapticsEnabled = true;

export function isHapticsEnabled() {
  return hapticsEnabled;
}

export async function loadHapticsEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
  hapticsEnabled = raw == null ? true : raw === 'true';
  return hapticsEnabled;
}

export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  hapticsEnabled = enabled;
  await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled));
}

void loadHapticsEnabled().catch(() => {});
