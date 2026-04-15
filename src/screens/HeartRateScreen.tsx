import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native';
import { HeartRateCaptureFlow } from '../components/heartRate/HeartRateCaptureFlow';
import { DefaultInstructionScreen } from '../components/heartRate/setupScreens';
import type { CaptureResult } from '../lib/heartRate/types';

interface HeartRateScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
  route?: {
    params?: {
      context?: string;
    };
  };
}

export function HeartRateScreen({ navigation, route }: HeartRateScreenProps) {
  const context = route?.params?.context;

  const handleComplete = useCallback(
    (result: CaptureResult) => {
      // Navigate back — the caller can read the result from navigation params
      // or via a callback passed through route params
      if (navigation != null) {
        navigation.goBack();
      }
    },
    [navigation],
  );

  const handleCancel = useCallback(() => {
    if (navigation != null) {
      navigation.goBack();
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeartRateCaptureFlow
        setupScreens={[DefaultInstructionScreen]}
        onComplete={handleComplete}
        onCancel={handleCancel}
        context={context}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
