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
            {/* always laid out, so signing never changes the card's height */}
            <Text style={[styles.signedBy, !signed && styles.unsigned]}>
              {name ? `Signed by ${name} · ${signedToday()}` : `Signed · ${signedToday()}`}
            </Text>
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
  // the layout leaves 2xl under every title; the pact reads as one document, so
  // its clauses sit closer to their heading
  content: {
    gap: spacing.lg,
    marginTop: -spacing.md,
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
  unsigned: {
    opacity: 0,
  },
  // inside the card, pressed over the end of the signature line
  seal: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.sm,
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
