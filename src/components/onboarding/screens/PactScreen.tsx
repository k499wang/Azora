import { Text } from '../../common/Text';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { entranceTiming } from '../entranceTiming';
import AzoAside from '../AzoAside';
import CelebrationOverlay from '../CelebrationOverlay';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import SignaturePad from '../SignaturePad';

interface PactScreenProps {
  name: string;
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
  name,
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
  const signer = name.trim();
  const today = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
        title=""
        titleSlot={
          <AzoAside
            text="Promise me you’ll show up for yourself?"
            variant="question"
            expression="proud"
            holding="notes"
            delayMs={entranceTiming.promptDelay}
          />
        }
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
          <View style={styles.document}>
            <View style={styles.documentHeader}>
              <View style={styles.titleRow}>
                <Text style={styles.documentTitle}>My Promise</Text>
                <Text style={styles.date}>{today}</Text>
              </View>
              <Text style={styles.preamble}>
                {signer ? `I, ${signer}, promise that:` : 'I promise that:'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.promises}>
              {promises.map((promise, index) => (
                <View key={promise} style={styles.clause}>
                  <Text style={styles.clauseNumber}>{`${index + 1}.`}</Text>
                  <Text style={styles.promise}>{promise}</Text>
                </View>
              ))}
            </View>
            <View style={styles.divider} />
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
    gap: spacing.md,
  },
  document: {
    ...card.base,
    padding: spacing.lg,
    gap: spacing.md,
  },
  documentHeader: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  date: {
    ...typography.overline,
    color: colors.text.secondary,
  },
  documentTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  preamble: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
  },
  promises: {
    gap: spacing.sm,
  },
  clause: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  clauseNumber: {
    ...typography.body.large,
    color: colors.primary.blue700,
    minWidth: spacing.lg,
  },
  promise: {
    ...typography.body.large,
    color: colors.text.primary,
    flex: 1,
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
