import { Text } from '../components/common/Text';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/common/icons/Icon';
import ChunkyButton, {
  CHUNKY_TONE,
  CHUNKY_TONE_QUIET,
} from '../components/common/ChunkyButton';
import MochiFace from '../features/room/MochiFace';
import { useAuthStore } from '../stores/authStore';
import {
  AppleSignInCancelledError,
  GoogleSignInCancelledError,
  isAppleSignInAvailable,
} from '../services/supabase';
import { colors } from '../theme/colors';
import { fonts, typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { isShortScreen } from '../theme/breakpoints';

const MOCHI_SIZE = 112;
const MOCHI_SIZE_COMPACT = 88;

// He is shown, not named. The first onboarding beat is "This is Mochi.", and
// introducing him here would spend that reveal before the story gets to it.
const TAGLINE = 'Here to help you unwind.';

function showTermsRequiredAlert() {
  Alert.alert(
    'Agree to continue',
    "Please agree to Azora's Terms & Conditions and Privacy Policy to continue.",
  );
}

export default function AuthLandingScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const compact = isShortScreen(screenHeight);
  const [agreed, setAgreed] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === 'ios');
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);

  useEffect(() => {
    let cancelled = false;
    isAppleSignInAvailable().then((available) => {
      if (!cancelled) setAppleAvailable(available);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onGooglePress = async () => {
    if (!agreed) return showTermsRequiredAlert();
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err instanceof GoogleSignInCancelledError) return;
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Google sign-in failed', message);
    } finally {
      setGoogleBusy(false);
    }
  };

  const onApplePress = async () => {
    if (!agreed) return showTermsRequiredAlert();
    if (appleBusy) return;
    setAppleBusy(true);
    try {
      await signInWithApple();
    } catch (err) {
      if (err instanceof AppleSignInCancelledError) return;
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Apple sign-in failed', message);
    } finally {
      setAppleBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={[styles.hero, compact && styles.heroCompact]}>
          <MochiFace size={compact ? MOCHI_SIZE_COMPACT : MOCHI_SIZE} />
          <View style={styles.copy}>
            <Text style={styles.appName}>Azora</Text>
            <Text style={styles.tagline}>{TAGLINE}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <SafeAreaView edges={['bottom']}>
          <View style={[styles.sheetContent, compact && styles.sheetContentCompact]}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              onPress={() => setAgreed((v) => !v)}
              style={styles.terms}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Icon name="sparkle" size={12} color={colors.text.inverse} />}
              </View>
              <Text style={styles.termsText}>
                I agree to Azora's{' '}
                <Text
                  style={styles.link}
                  onPress={() => void Linking.openURL('https://www.tryazora.app/terms')}
                >
                  Terms & Conditions
                </Text>{' '}
                and acknowledge the{' '}
                <Text
                  style={styles.link}
                  onPress={() => void Linking.openURL('https://www.tryazora.app/privacy')}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </Pressable>

            <View style={styles.actions}>
              {appleAvailable && (
                <ChunkyButton
                  label="Continue with Apple"
                  onPress={onApplePress}
                  tone={CHUNKY_TONE}
                  loading={appleBusy}
                  icon={
                    <Icon name="apple" size={18} color={colors.text.inverse} />
                  }
                />
              )}

              <ChunkyButton
                label="Continue with Google"
                onPress={onGooglePress}
                tone={CHUNKY_TONE_QUIET}
                loading={googleBusy}
                icon={<Icon name="google" size={18} />}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  heroSafe: {
    flex: 1,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  heroCompact: {
    gap: spacing.md,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  appName: {
    ...typography.display.display2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  tagline: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sheet: {
    backgroundColor: colors.background.elevated,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  sheetContentCompact: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary.blue600,
    borderColor: colors.primary.blue600,
  },
  termsText: {
    flex: 1,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
  },
  link: {
    color: colors.primary.blue600,
    textDecorationLine: 'underline',
  },
  actions: {
    gap: spacing.sm,
  },
});
