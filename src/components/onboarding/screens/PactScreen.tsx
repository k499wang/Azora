import { Text } from '../../common/Text';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import PactSeal from '../PactSeal';
import SignaturePad from '../SignaturePad';
import { scaleVisual } from '../onboardingVisualScale';

interface PactScreenProps {
  dailyMinutes: number;
  name: string | null;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

const SEAL_SIZE = scaleVisual(96);
/** how long the seal sits on the page before the celebration covers it */
const SEAL_HOLD_MS = 450;

function signedToday() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function durationLabel(dailyMinutes: number) {
  if (dailyMinutes === 0) return '30 seconds';
  if (dailyMinutes === 1) return '1 minute';
  return `${dailyMinutes} minutes`;
}

export default function PactScreen({
  dailyMinutes,
  name,
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
  const [stamped, setStamped] = useState(false);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    },
    [],
  );

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
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      setCelebrating(false);
      setHasConfirmed(false);
      setStamped(false);
    }
  }, [errorMessage]);

  const handleConfirm = useCallback(() => {
    if (hasConfirmed || isSubmitting) return;

    setHasConfirmed(true);
    setStamped(true);
    onConfirm();
  }, [hasConfirmed, isSubmitting, onConfirm]);

  const handleSealLand = useCallback(() => {
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    celebrateTimer.current = setTimeout(() => setCelebrating(true), SEAL_HOLD_MS);
  }, []);

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
              loading={isSubmitting && !stamped}
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
            {signed ? (
              <Text style={styles.signedBy}>
                {name ? `Signed by ${name} · ${signedToday()}` : `Signed · ${signedToday()}`}
              </Text>
            ) : null}
            <View style={styles.seal}>
              <PactSeal size={SEAL_SIZE} stamped={stamped} onLand={handleSealLand} />
            </View>
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
    gap: spacing.sm,
  },
  signedBy: {
    ...typography.body.small,
    color: colors.text.secondary,
    paddingRight: SEAL_SIZE * 0.6,
  },
  // over the card's lower corner, the way a stamp lands half on the page edge
  seal: {
    position: 'absolute',
    right: -spacing.sm,
    bottom: -SEAL_SIZE * 0.35,
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
