import { Text } from '../../common/Text';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import CelebrationOverlay from '../CelebrationOverlay';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import SignaturePad from '../SignaturePad';

interface PactScreenProps {
  dailyMinutes: number;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

function durationLabel(dailyMinutes: number) {
  if (dailyMinutes === 0) return '30 seconds';
  if (dailyMinutes === 1) return '1 minute';
  return `${dailyMinutes} minutes`;
}

export default function PactScreen({
  dailyMinutes,
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onConfirm,
  onBack,
}: PactScreenProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [signed, setSigned] = useState(false);

  const promises = [
    `I’ll take ${durationLabel(dailyMinutes)} for myself each day!`,
    'I’ll make the most of my day!',
    'I’ll keep my life organized!',
    'I’ll stress less and focus more!',
    'I’ll be the best version of myself!',
    'If I miss a day, I’ll come back tomorrow!',
  ];

  useEffect(() => {
    if (errorMessage) {
      setCelebrating(false);
      setHasConfirmed(false);
    }
  }, [errorMessage]);

  const handleConfirm = useCallback(() => {
    if (celebrating || isSubmitting) return;

    setHasConfirmed(true);
    setCelebrating(true);

    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }

    onConfirm();
  }, [celebrating, isSubmitting, onConfirm]);

  return (
    <>
      <OnboardingScreenLayout
        title="Let’s sign your Azora contract"
        progress={stepIndex / stepCount}
        onBack={onBack}
        footer={
          <View style={styles.footer}>
            <OnboardingPrimaryButton
              label="Confirm"
              onPress={handleConfirm}
              disabled={!signed || hasConfirmed}
              loading={isSubmitting && !celebrating}
            />
            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}
          </View>
        }
      >
        <View style={styles.content}>
          <View style={styles.promises}>
            {promises.map((promise) => (
              <View key={promise} style={styles.clause}>
                <View style={styles.bullet} />
                <Text style={styles.promise}>{promise}</Text>
              </View>
            ))}
          </View>
          <View style={styles.signatureCard}>
            <SignaturePad
              label="Sign your name with your finger:"
              onSignedChange={setSigned}
            />
          </View>
        </View>
      </OnboardingScreenLayout>

      {celebrating ? <CelebrationOverlay /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  promises: {
    gap: spacing.sm,
  },
  clause: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.primary.blue700,
  },
  promise: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  signatureCard: {
    ...card.base,
    ...card.shadow,
    padding: spacing.lg,
  },
  footer: {
    gap: spacing.xs,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
});
