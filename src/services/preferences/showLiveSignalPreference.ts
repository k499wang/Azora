import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOW_LIVE_SIGNAL_KEY = 'settings:show_live_signal';

let showLiveSignal = true;
const listeners = new Set<(enabled: boolean) => void>();

function emit() {
  listeners.forEach((listener) => listener(showLiveSignal));
}

export function isShowLiveSignalEnabled() {
  return showLiveSignal;
}

export function subscribeShowLiveSignalEnabled(
  listener: (enabled: boolean) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function loadShowLiveSignalEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SHOW_LIVE_SIGNAL_KEY);
  const next = raw == null ? true : raw === 'true';
  if (next !== showLiveSignal) {
    showLiveSignal = next;
    emit();
  }
  return showLiveSignal;
}

export async function setShowLiveSignalEnabled(enabled: boolean): Promise<void> {
  if (showLiveSignal !== enabled) {
    showLiveSignal = enabled;
    emit();
  }
  await AsyncStorage.setItem(SHOW_LIVE_SIGNAL_KEY, String(enabled));
}

void loadShowLiveSignalEnabled().catch(() => {});
