import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeartRateCaptureFlow } from '../components/heartRate/HeartRateCaptureFlow';
import { DefaultInstructionScreen } from '../components/heartRate/setupScreens';
import type { CaptureResult } from '../lib/heartRate/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { HeartRateScreenProps } from '../app/navigation';

export function HeartRateScreen({ navigation, route }: HeartRateScreenProps) {
  const context = route?.params?.context;
  const insets = useSafeAreaInsets();

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
      <Pressable
        onPress={handleCancel}
        hitSlop={16}
        accessibilityLabel="Close heart rate measurement"
        style={[styles.closeButton, { top: insets.top + spacing.xs }]}
      >
        <MaterialCommunityIcons name="close" size={26} color={colors.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.md,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
