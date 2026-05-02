import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeartRateCaptureFlow } from '../components/heartRate/HeartRateCaptureFlow';
import { DefaultInstructionScreen } from '../components/heartRate/setupScreens';
import type { CaptureResult } from '../lib/heartRate/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
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
        accessibilityLabel="Cancel heart rate measurement"
        style={({ pressed }) => [
          styles.cancelButton,
          { top: insets.top + spacing.xs },
          pressed && styles.cancelButtonPressed,
        ]}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  cancelButton: {
    position: 'absolute',
    left: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  cancelButtonPressed: {
    opacity: 0.6,
  },
  cancelText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
});
