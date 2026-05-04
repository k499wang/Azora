import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from '../../common/icons/Icon';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import CelebrationOverlay from '../CelebrationOverlay';

interface PactScreenProps {
  intentTitle: string;
  dailyMinutes: number;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export default function PactScreen({
  intentTitle,
  dailyMinutes,
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onConfirm,
  onBack,
}: PactScreenProps) {
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (errorMessage) setCelebrating(false);
  }, [errorMessage]);

  const handleConfirm = () => {
    if (celebrating || isSubmitting) return;
    setCelebrating(true);
    onConfirm();
  };

  return (
    <>
      <OnboardingScreenLayout
        title="Your daily pact"
        subtitle="A small promise to yourself — that's where real change starts."
        progress={stepIndex / stepCount}
        onBack={onBack}
        footer={
          <OnboardingPrimaryButton
            label="I'm in"
            onPress={handleConfirm}
            loading={isSubmitting && !celebrating}
            disabled={celebrating}
          />
        }
      >
        <View style={styles.cardWrap}>
        <View style={styles.pactCard}>
          <View style={styles.stamp}>
            <Text style={styles.stampText}>AZORA</Text>
            <Text style={styles.stampSub}>SEALED · 2026</Text>
          </View>

          <View style={styles.leftColumn}>
            <Text style={styles.value}>{dailyMinutes}</Text>
            <Text style={styles.unit}>min / day</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rightColumn}>
            <Text style={styles.kicker}>MY PACT</Text>
            <Text style={styles.lead}>
              I'll give Azora{' '}
              <Text style={styles.leadStrong}>
                {dailyMinutes} min a day
              </Text>{' '}
              to {intentTitle.toLowerCase()}.
            </Text>
            <View style={styles.footerRow}>
              <Icon name="sun" size={14} color={colors.orange[500]} />
              <Text style={styles.footerText}>Starts tomorrow</Text>
            </View>
          </View>
        </View>
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </OnboardingScreenLayout>
      {celebrating ? <CelebrationOverlay /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pactCard: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    aspectRatio: 1.65,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: spacing.xl,
    borderRadius: 24,
    overflow: 'hidden',
  },
  stamp: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    transform: [{ rotate: '-10deg' }],
    borderWidth: 1.5,
    borderColor: colors.orange[500],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    opacity: 0.85,
  },
  stampText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 9,
    letterSpacing: 1.6,
    color: colors.orange[500],
  },
  stampSub: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 7,
    letterSpacing: 1.2,
    color: colors.orange[500],
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 1,
  },
  leftColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 84,
    lineHeight: 88,
    letterSpacing: -2,
    color: colors.primary.blue700,
  },
  unit: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.lg,
  },
  rightColumn: {
    flex: 1.3,
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  kicker: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.text.tertiary,
  },
  lead: {
    ...typography.body.medium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  leadStrong: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
