import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon, { type IconName } from '../components/common/icons/Icon';
import { useAuthStore } from '../stores/authStore';
import {
  AppleSignInCancelledError,
  GoogleSignInCancelledError,
  isAppleSignInAvailable,
} from '../services/supabase';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';

function showTermsRequiredAlert() {
  Alert.alert(
    'Agree to continue',
    "Please agree to Azora's Terms & Conditions and Privacy Policy to continue.",
  );
}

interface Slide {
  id: string;
  icon: IconName;
  iconTint: string;
  bubbleTint: string;
  eyebrow: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: 'calm',
    icon: 'breath-wave',
    iconTint: colors.primary.blue600,
    bubbleTint: colors.primary.blue100,
    eyebrow: 'Feel better tonight',
    title: 'Calm your mind in 5 minutes.',
    body: 'Guided breathwork that drops your stress in a single session — no app fatigue, no fluff.',
  },
  {
    id: 'science',
    icon: 'heart-rmssd',
    iconTint: colors.primary.blue600,
    bubbleTint: colors.primary.blue100,
    eyebrow: 'Backed by science',
    title: 'Measured by your heart.',
    body: 'Real-time HRV — the gold-standard biomarker used in clinical research — shows you exactly when you shift into recovery.',
  },
  {
    id: 'sleep',
    icon: 'breath-moon',
    iconTint: colors.primary.blue700,
    bubbleTint: colors.primary.blue100,
    eyebrow: 'Sleep deeper',
    title: 'Wind down without scrolling.',
    body: '4-7-8 and resonance breathing protocols proven to lower nighttime heart rate and ease you into sleep.',
  },
  {
    id: 'athlete',
    icon: 'breath-lightning',
    iconTint: colors.orange[500],
    bubbleTint: colors.orange[100],
    eyebrow: 'Train like an athlete',
    title: 'Recover faster, breathe stronger.',
    body: 'The same box-breathing protocols used by Navy SEALs and elite athletes — now tied to your live HRV.',
  },
  {
    id: 'heart',
    icon: 'heart-glow',
    iconTint: colors.error[500],
    bubbleTint: colors.error[100],
    eyebrow: 'Heart & wellness',
    title: 'Build a stronger nervous system.',
    body: 'Track HRV, RMSSD, and SDNN over time. Watch your resilience grow with every session.',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AuthLandingScreen() {
  const [agreed, setAgreed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === 'ios');
  const listRef = useRef<FlatList<Slide>>(null);
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
    if (!agreed) {
      showTermsRequiredAlert();
      return;
    }
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
    if (!agreed) {
      showTermsRequiredAlert();
      return;
    }
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

  const onViewable = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
    },
  ).current;

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(i);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>AZORA</Text>
          <View style={styles.brandRight}>
            <View style={styles.proofBadge}>
              <View style={styles.proofDot} />
              <Text style={styles.proofText}>HRV-backed</Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewable}
          onMomentumScrollEnd={onMomentumEnd}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.iconWrap}>
                <View style={[styles.iconRingOuter, { backgroundColor: item.bubbleTint }]} />
                <View style={[styles.iconRingInner, { backgroundColor: item.bubbleTint }]} />
                <View style={styles.iconCore}>
                  <Icon name={item.icon} size={72} color={item.iconTint} />
                </View>
              </View>
              <View style={styles.copy}>
                <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <SafeAreaView edges={['bottom']} style={styles.sheetSafe}>
          <View style={styles.sheetContent}>
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
                I agree to Azora's <Text style={styles.link}>Terms & Conditions</Text> and
                acknowledge the <Text style={styles.link}>Privacy Policy</Text>.
              </Text>
            </Pressable>

            <View style={styles.actions}>
              {appleAvailable && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: appleBusy }}
                  onPress={onApplePress}
                  disabled={appleBusy}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                    appleBusy && styles.buttonDisabled,
                  ]}
                >
                  <Icon name="apple" size={18} color={colors.text.inverse} />
                  <Text style={styles.primaryButtonLabel}>
                    {appleBusy ? 'Signing in…' : 'Continue with Apple'}
                  </Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: googleBusy }}
                onPress={onGooglePress}
                disabled={googleBusy}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                  googleBusy && styles.buttonDisabled,
                ]}
              >
                <Icon name="google" size={18} />
                <Text style={styles.secondaryButtonLabel}>
                  {googleBusy ? 'Signing in…' : 'Continue with Google'}
                </Text>
              </Pressable>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  brand: {
    ...typography.overline,
    color: colors.text.brand,
    letterSpacing: 3,
  },
  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.accentSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  proofDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success[500],
  },
  proofText: {
    ...typography.label.small,
    color: colors.text.brand,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  iconWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.45,
  },
  iconRingInner: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
  },
  iconCore: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.overline,
    color: colors.text.brand,
    letterSpacing: 2,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary.blue600,
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
  sheetSafe: {},
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.blue600,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.accentSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  primaryButtonLabel: {
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  secondaryButtonLabel: {
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
