import { Text } from '../components/common/Text';
import { Alert, Dimensions, FlatList, Linking, Platform, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon, { type IconName } from '../components/common/icons/Icon';
import PhoneFrame from '../components/common/PhoneFrame';
import { useAuthStore } from '../stores/authStore';
import {
  AppleSignInCancelledError,
  GoogleSignInCancelledError,
  isAppleSignInAvailable,
} from '../services/supabase';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { AUTH_LANDING_SLIDES, type AuthLandingSlide } from '../data/authLandingSlides';

function showTermsRequiredAlert() {
  Alert.alert(
    'Agree to continue',
    "Please agree to Azora's Terms & Conditions and Privacy Policy to continue.",
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AuthLandingScreen() {
  const [agreed, setAgreed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === 'ios');
  const listRef = useRef<FlatList<AuthLandingSlide>>(null);
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
        <FlatList
          ref={listRef}
          data={AUTH_LANDING_SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewable}
          onMomentumScrollEnd={onMomentumEnd}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <PhoneFrame>
                <Image
                  source={item.source}
                  style={styles.frameImage}
                  contentFit="cover"
                  contentPosition="top center"
                  cachePolicy="memory-disk"
                  transition={0}
                />
              </PhoneFrame>
              <View style={styles.copy}>
                <Text style={styles.slideTitle}>{item.title}</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.dots}>
          {AUTH_LANDING_SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <SafeAreaView edges={['bottom']}>
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
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  slideTitle: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 30,
    color: colors.text.primary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '500',
    fontSize: 16,
  },
  secondaryButtonLabel: {
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
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
