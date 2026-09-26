import { Text } from '../components/common/Text';
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
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
import { Land, Rise } from '../components/common/Reveal';
import { spacing } from '../theme/spacing';
import { stagger } from '../theme/motion';
import { isShortScreen } from '../theme/breakpoints';
import { COMMUNITY_SIZE } from '../data/socialProof';

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

const RATING_VALUE = 'Top rated';
const RATING_LABEL = 'on the App Store';
const REACH_VALUE = COMMUNITY_SIZE;
const REACH_LABEL = 'people resetting with Azora';
const QUOTE = '\u201cFinally an app that understands me.\u201d';

/**
 * The screen assembles itself on one curve, bottom-weighted: the brand settles
 * first and the buttons arrive last and land, so the eye finishes on the thing
 * to tap. Nothing moves once it is in place — Azo is a still portrait here, not
 * a character.
 */
const ENTRANCE = {
  appName: 0,
  azo: stagger.base,
  ratingLaurel: stagger.base * 2,
  reachLaurel: stagger.base * 3,
  quote: stagger.base * 4,
  actions: stagger.base * 6,
  terms: stagger.base * 7,
} as const;

// The entrance is a first-impression, not a transition: coming back from the
// auth sheet, or from a failed sign-in, should find the screen already settled.
// Burnt when the entrance actually plays, not when the screen mounts — this
// screen mounts under the welcome intro and waits there.
let entrancePlayed = false;

interface EntranceProps {
  /** whether this mount animates at all; false renders the settled screen */
  animate: boolean;
  /** holds the element hidden until the screen is actually on show */
  when: boolean;
  delay: number;
  land?: boolean;
  style?: ViewStyle;
  children: ReactNode;
}

function Entrance({ animate, when, delay, land, style, children }: EntranceProps) {
  if (!animate) return <View style={style}>{children}</View>;
  const Verb = land ? Land : Rise;
  return (
    <Verb delay={delay} when={when} style={style}>
      {children}
    </Verb>
  );
}

interface AuthLandingScreenProps {
  /** The welcome intro covers this screen; the entrance waits behind it. */
  introComplete?: boolean;
}

export default function AuthLandingScreen({
  introComplete = true,
}: AuthLandingScreenProps) {
  const { height: screenHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [animate] = useState(() => !entrancePlayed && !reducedMotion);

  useEffect(() => {
    if (animate && introComplete) entrancePlayed = true;
  }, [animate, introComplete]);
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
        <View style={styles.hero}>
          <View style={styles.brandLockup}>
            <Entrance animate={animate} when={introComplete} delay={ENTRANCE.appName}>
              <Text style={[styles.appName, compact && styles.appNameCompact]}>
                Azora
              </Text>
            </Entrance>
            <Entrance animate={animate} when={introComplete} delay={ENTRANCE.azo}>
              <Image
                source={AZO_IMAGE}
                style={{ width: azoSize, height: azoSize }}
                contentFit="contain"
                accessible={false}
              />
            </Entrance>
          </View>
          <View style={[styles.statSlot, compact && styles.statSlotCompact]}>
            <Entrance
              animate={animate}
              when={introComplete}
              delay={ENTRANCE.ratingLaurel}
              style={styles.statRow}
            >
              <LaurelStat
                scale={compact ? 'sm' : 'lg'}
                value={RATING_VALUE}
                label={RATING_LABEL}
                size={compact ? LAUREL_SIZE_SMALL_COMPACT : LAUREL_SIZE_SMALL}
              />
            </Entrance>
            <Entrance
              animate={animate}
              when={introComplete}
              delay={ENTRANCE.reachLaurel}
              style={styles.statRow}
            >
              <LaurelStat
                scale={compact ? 'sm' : 'lg'}
                value={REACH_VALUE}
                label={REACH_LABEL}
                size={compact ? LAUREL_SIZE_COMPACT : LAUREL_SIZE}
              />
            </Entrance>
          </View>
          <Entrance
            animate={animate}
            when={introComplete}
            delay={ENTRANCE.quote}
            style={styles.quoteSlot}
          >
            <Text style={styles.quote}>{QUOTE}</Text>
          </Entrance>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']}>
        <View style={[styles.footer, compact && styles.footerCompact]}>
          <Entrance
            animate={animate}
            when={introComplete}
            delay={ENTRANCE.actions}
            land
            style={styles.actions}
          >
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
          </Entrance>

          <Entrance animate={animate} when={introComplete} delay={ENTRANCE.terms}>
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
          </Entrance>
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
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  brandLockup: {
    alignItems: 'center',
    gap: 0,
    transform: [{ translateY: spacing.mdPlus }],
  },
  statSlot: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  // A laurel frame stretches to the width it is given, so the wrapper it
  // animates inside has to pass the stat slot's full width through rather than
  // shrinking to its own content.
  statRow: {
    alignSelf: 'stretch',
  },
  statSlotCompact: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  appName: {
    ...typography.display.display1,
    color: colors.primary.blue500,
    textAlign: 'center',
  },
  appNameCompact: {
    ...typography.display.display3,
  },
  quoteSlot: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
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
