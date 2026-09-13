import { Text } from '../components/common/Text';
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/common/icons/Icon';
import LaurelStat from '../components/common/LaurelStat';
import BottomSheet from '../components/common/BottomSheet';
import ChunkyButton, {
  CHUNKY_TONE,
  CHUNKY_TONE_QUIET,
} from '../components/common/ChunkyButton';
import { useAuthStore } from '../stores/authStore';
import {
  AppleSignInCancelledError,
  GoogleSignInCancelledError,
  isAppleSignInAvailable,
} from '../services/supabase';
import { contentColumn } from '../theme/breakpoints';
import { colors } from '../theme/colors';
import { fonts, typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { isShortScreen } from '../theme/breakpoints';

// The mascot is the one element with slack in it, so it is sized from the
// window rather than a breakpoint: the gap the review sits in is protected
// first, and whatever height is left over becomes the mascot.
const AZO_MIN_SIZE = 112;
const AZO_MAX_SIZE = 180;
const AZO_HEIGHT_SHARE = 0.2;
const AZO_IMAGE = require('../../assets/mascot/azo-head.png');
const LAUREL_SIZE = 62;
const LAUREL_SIZE_COMPACT = 50;
const LAUREL_SIZE_SMALL = 46;
const LAUREL_SIZE_SMALL_COMPACT = 38;

// Placeholder until the real number is confirmed.
const RATING_VALUE = '4.9';
const RATING_LABEL = 'average App Store rating';
const REACH_VALUE = '50,000';
const REACH_LABEL = 'people resetting with Azora';
const QUOTE = '\u201cFinally an app that understands me.\u201d';

export default function AuthLandingScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const compact = isShortScreen(screenHeight);
  const azoSize = Math.round(
    Math.min(AZO_MAX_SIZE, Math.max(AZO_MIN_SIZE, screenHeight * AZO_HEIGHT_SHARE)),
  );
  const [authSheet, setAuthSheet] = useState<'signup' | 'login' | null>(null);
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

  const openAuthSheet = (mode: 'signup' | 'login') => setAuthSheet(mode);

  const onGooglePress = async () => {
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
          <Text style={[styles.appName, compact && styles.appNameCompact]}>
            Azora
          </Text>
          <Image
            source={AZO_IMAGE}
            style={{ width: azoSize, height: azoSize }}
            contentFit="contain"
            accessible={false}
          />
          <View style={[styles.statSlot, compact && styles.statSlotCompact]}>
            <LaurelStat
              scale="sm"
              value={RATING_VALUE}
              label={RATING_LABEL}
              size={compact ? LAUREL_SIZE_SMALL_COMPACT : LAUREL_SIZE_SMALL}
              icon={
                <Icon name="star" size={20} color={colors.accolade.laurel} />
              }
            />
            <LaurelStat
              value={REACH_VALUE}
              label={REACH_LABEL}
              size={compact ? LAUREL_SIZE_COMPACT : LAUREL_SIZE}
            />
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.quoteSlot, compact && styles.quoteSlotCompact]}>
        <Text style={styles.quote}>{QUOTE}</Text>
      </View>

      <SafeAreaView edges={['bottom']}>
        <View style={[styles.footer, compact && styles.footerCompact]}>
          <View style={styles.actions}>
            <ChunkyButton
              label="Get started"
              onPress={() => openAuthSheet('signup')}
              tone={CHUNKY_TONE}
            />
            <ChunkyButton
              label="I already have an account"
              onPress={() => openAuthSheet('login')}
              tone={CHUNKY_TONE_QUIET}
            />
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to Azora's{' '}
            <Text
              style={styles.link}
              onPress={() => void Linking.openURL('https://www.tryazora.app/terms')}
            >
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text
              style={styles.link}
              onPress={() => void Linking.openURL('https://www.tryazora.app/privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </SafeAreaView>

      <BottomSheet
        visible={authSheet != null}
        onClose={() => setAuthSheet(null)}
        title={authSheet === 'login' ? 'Welcome back' : 'Sign up'}
        titleAlign="center"
      >
        <View style={styles.actions}>
          {appleAvailable && (
            <ChunkyButton
              label="Continue with Apple"
              onPress={onApplePress}
              tone={CHUNKY_TONE}
              loading={appleBusy}
              icon={<Icon name="apple" size={18} color={colors.text.inverse} />}
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
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  heroSafe: {
    flex: 1,
  },
  hero: {
    ...contentColumn,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  heroCompact: {
    gap: spacing.sm,
  },
  statSlot: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  statSlotCompact: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  quoteSlot: {
    ...contentColumn,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  quoteSlotCompact: {
    paddingTop: spacing.md,
  },
  appName: {
    ...typography.display.display1,
    color: colors.primary.blue500,
    textAlign: 'center',
  },
  appNameCompact: {
    ...typography.display.display3,
  },
  quote: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    ...contentColumn,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  footerCompact: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  termsText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
  },
  link: {
    color: colors.primary.blue500,
    textDecorationLine: 'underline',
  },
  actions: {
    gap: spacing.sm,
  },
});
