import AsyncStorage from '@react-native-async-storage/async-storage';

const HEART_RATE_MONITORING_KEY = 'settings:heart_rate_monitoring_enabled';

let heartRateMonitoringEnabled = false;
const listeners = new Set<(enabled: boolean) => void>();

function emit() {
  listeners.forEach((listener) => listener(heartRateMonitoringEnabled));
}

export function isHeartRateMonitoringEnabled() {
  return heartRateMonitoringEnabled;
}

export function subscribeHeartRateMonitoringEnabled(
  listener: (enabled: boolean) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function loadHeartRateMonitoringEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(HEART_RATE_MONITORING_KEY);
  const next = raw == null ? false : raw === 'true';
  if (next !== heartRateMonitoringEnabled) {
    heartRateMonitoringEnabled = next;
    emit();
  }
  return heartRateMonitoringEnabled;
}

export async function setHeartRateMonitoringEnabled(enabled: boolean): Promise<void> {
  if (heartRateMonitoringEnabled !== enabled) {
    heartRateMonitoringEnabled = enabled;
    emit();
  }
  await AsyncStorage.setItem(HEART_RATE_MONITORING_KEY, String(enabled));
}

void loadHeartRateMonitoringEnabled().catch(() => {});
