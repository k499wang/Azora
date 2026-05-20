import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import AmbientBackground from '../common/AmbientBackground';

interface OnboardingScreenLayoutProps {
  title: string;
  subtitle?: string;
  progress: number;
  onBack?: () => void;
  onSkip?: () => void;
  footer: ReactNode;
  children: ReactNode;
  keyboardAvoiding?: boolean;
  centerBody?: boolean;
}

export default function OnboardingScreenLayout({
  title,
  subtitle,
  progress,
  onBack,
  onSkip,
  footer,
  children,
  keyboardAvoiding = false,
  centerBody = false,
}: OnboardingScreenLayoutProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!keyboardAvoiding) return;
    const show = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => show.remove();
  }, [keyboardAvoiding]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const handleBack = () => {
    if (!onBack) return;
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onBack();
  };

  const handleSkip = () => {
    if (!onSkip) return;
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSkip();
  };

  const clamped = Math.max(0, Math.min(1, progress));

  const inner = (
    <>
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backGlyph}>←</Text>
          </Pressable>
        ) : null}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
        </View>
        {onSkip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip"
            hitSlop={12}
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed,
            ]}
          >
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            centerBody && styles.contentCentered,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          {title ? (
            <View style={styles.copy}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          ) : null}

          {centerBody ? (
            <View style={styles.bodyCenteredOverlay} pointerEvents="box-none">
              <View style={styles.bodyCenteredInner}>{children}</View>
            </View>
          ) : (
            <View style={styles.body}>{children}</View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottom}>{footer}</View>
    </>
  );

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {inner}
          </KeyboardAvoidingView>
        ) : (
          inner
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backGlyph: {
    fontSize: 22,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 24,
  },
  skipButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    gap: spacing['2xl'],
  },
  copy: {
    gap: spacing.sm,
  },
  contentCentered: {
    gap: 0,
  },
  bodyCenteredOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  bodyCenteredInner: {
    width: '100%',
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  body: {
    flex: 1,
    gap: spacing.lg,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
