import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'onboarding_complete';

export function useOnboardingComplete(): { isComplete: boolean | null; markComplete: () => Promise<void> } {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((value) => {
      setIsComplete(value === 'true');
    });
  }, []);

  const markComplete = useCallback(async () => {
    await AsyncStorage.setItem(KEY, 'true');
    setIsComplete(true);
  }, []);

  return { isComplete, markComplete };
}
