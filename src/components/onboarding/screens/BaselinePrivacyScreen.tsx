import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

const PRIVACY_URL = 'https://www.tryazora.app/privacy';

interface BaselinePrivacyScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function BaselinePrivacyScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: BaselinePrivacyScreenProps) {
  const [hasConsented, setHasConsented] = useState(false);

  return (
    <OnboardingScreenLayout
      title="We take your privacy and security seriously"
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <View style={styles.footer}>
          <View style={styles.consentRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel="Consent to camera access for this heart-rate reading"
              accessibilityState={{ checked: hasConsented }}
              hitSlop={4}
              onPress={() => setHasConsented((current) => !current)}
              style={({ pressed }) => [styles.checkboxTarget, pressed && styles.pressed]}
            >
              <View style={[styles.checkbox, hasConsented && styles.checkboxChecked]}>
                {hasConsented ? (
                  <Icon name="check" size={15} color={colors.text.inverse} />
                ) : null}
              </View>
            </Pressable>
            <View style={styles.consentCopy}>
              <Text style={styles.consentText}>
                I consent to Azora accessing my camera for this reading, as
                described above and in Azora’s{' '}
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Open Azora Privacy Policy"
                onPress={() => void Linking.openURL(PRIVACY_URL)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.privacyLink}>Privacy Policy.</Text>
              </Pressable>
            </View>
          </View>
          <OnboardingPrimaryButton
            label="Continue"
            onPress={onContinue}
            disabled={!hasConsented}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onSkip}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          >
            <Text style={styles.skipText}>Measure later</Text>
          </Pressable>
        </View>
      }
    >
      <Text style={styles.explanation}>
        When you take a heart-rate reading, Azora uses your rear camera and flash
        only to estimate your pulse from subtle color changes in your fingertip.
        The reading is processed on your device. Azora does not save photos or
        raw camera video. Your heart-rate result may be used to personalize your
        Azora experience. You can skip the reading and continue onboarding.
      </Text>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  explanation: {
    ...typography.body.large,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: -spacing.lg,
  },
  privacyLink: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
    textDecorationLine: 'underline',
  },
  footer: {
    gap: spacing.xs,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  checkboxTarget: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
  },
  checkboxChecked: {
    borderColor: colors.primary.blue700,
    backgroundColor: colors.primary.blue700,
  },
  consentCopy: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 10,
  },
  consentText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  skip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    ...typography.button.small,
    color: colors.text.secondary,
  },
  pressed: {
    opacity: 0.65,
  },
});
