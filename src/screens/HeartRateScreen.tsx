import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { HeartRateCaptureFlow } from '../components/heartRate/HeartRateCaptureFlow';
import { DefaultInstructionScreen } from '../components/heartRate/setupScreens';
import type { CaptureResult } from '../lib/heartRate/types';
import { colors } from '../theme/colors';
import type { HeartRateScreenProps } from '../app/navigation';

export function HeartRateScreen({ navigation, route }: HeartRateScreenProps) {
  const context = route?.params?.context;

  const handleComplete = useCallback(
    (_result: CaptureResult) => {
      navigation?.goBack();
    },
    [navigation],
  );

  const handleCancel = useCallback(() => {
    navigation?.goBack();
  }, [navigation]);

  return (
    <View style={styles.root}>
      <HeartRateCaptureFlow
        setupScreens={[DefaultInstructionScreen]}
        onComplete={handleComplete}
        onCancel={handleCancel}
        context={context}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
