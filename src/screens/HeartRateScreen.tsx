import { useCallback } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeartRateCaptureFlow } from '../components/heartRate/HeartRateCaptureFlow';
import { DefaultInstructionScreen } from '../components/heartRate/setupScreens';
import type { CaptureResult } from '../lib/heartRate/types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={handleCancel}
          hitSlop={12}
          style={styles.closeButton}
          accessibilityLabel="Close heart rate measurement"
        >
          <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
        </Pressable>
        <View style={styles.titleWrap}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={20}
              color={colors.error[500]}
            />
            <Text style={styles.title}>Measure Heart Rate</Text>
          </View>
          <Text style={styles.subtitle}>Place your finger on the rear camera</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <HeartRateCaptureFlow
          setupScreens={[DefaultInstructionScreen]}
          onComplete={handleComplete}
          onCancel={handleCancel}
          context={context}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
});
