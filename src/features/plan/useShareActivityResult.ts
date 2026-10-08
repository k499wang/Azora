import { useCallback, useRef } from 'react';
import { Alert, Share } from 'react-native';

export function useShareActivityResult(message: string) {
  const sharing = useRef(false);

  return useCallback(async () => {
    if (sharing.current) return;
    sharing.current = true;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      sharing.current = false;
    }
  }, [message]);
}
