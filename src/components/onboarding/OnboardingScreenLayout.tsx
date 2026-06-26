import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../common/icons/Icon';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';

const ENTRANCE_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const ENTRANCE_INITIAL_SCALE = 0.992;

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
  const insets = useSafeAreaInsets();
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(ENTRANCE_INITIAL_SCALE)).current;
  const scrollRef = useRef<ScrollView>(null);

  const scrollFade = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    if (!hasOverflow) {
      bounce.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 5,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hasOverflow, bounce]);

  const setFadeVisible = (visible: boolean) => {
    Animated.timing(scrollFade, {
      toValue: visible ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const recomputeOverflow = () => {
    const overflow = contentHeight.current - viewportHeight.current > 1;
    setHasOverflow(overflow);
    setFadeVisible(overflow);
  };

  const handleViewportLayout = (event: LayoutChangeEvent) => {
    viewportHeight.current = event.nativeEvent.layout.height;
    recomputeOverflow();
  };

  const handleContentSizeChange = (_: number, height: number) => {
    contentHeight.current = height;
    recomputeOverflow();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasOverflow) return;
    const { contentOffset, contentSize, layoutMeasurement } =
      event.nativeEvent;
    const distanceToBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setFadeVisible(distanceToBottom > 24);
  };
  useEffect(() => {
    if (!keyboardAvoiding) return;
    const show = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => show.remove();
  }, [keyboardAvoiding]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    // Gate the entrance behind runAfterInteractions so the native-driven fade
    // starts on an idle UI thread instead of racing the freshly-mounted screen.
    const handle = InteractionManager.runAfterInteractions(() => {
      animation = Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 680,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 760,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
      ]);
      animation.start();
    });

    return () => {
      handle.cancel();
      animation?.stop();
    };
  }, [fade, scale]);

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

  const inner = (
    <Animated.View style={[styles.entrance, { opacity: fade }]}>
      <View style={styles.header}>
        <View style={styles.headerSlotLeft}>
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
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]} />
        </View>
        <View style={styles.headerSlotRight}>
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
      </View>

      <View style={styles.scrollWrap}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onLayout={handleViewportLayout}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
        >
          <Animated.View
            style={[
              styles.content,
              centerBody && styles.contentCentered,
              { transform: [{ scale }] },
            ]}
          >
            {title ? (
              <View style={styles.copy}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
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

        <Animated.View
          pointerEvents="none"
          style={[styles.scrollFade, { opacity: scrollFade }]}
        >
          <LinearGradient
            colors={['#F4F5F700', colors.background.primary]}
            style={styles.scrollFadeGradient}
          />
          <Animated.View
            style={[styles.scrollHint, { transform: [{ translateY: bounce }] }]}
          >
            <Icon name="chevron-down" size={22} color={colors.text.tertiary} />
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.bottom}>{footer}</View>
    </Animated.View>
  );

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboard: {
    flex: 1,
  },
  entrance: {
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
  headerSlotLeft: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerSlotRight: {
    width: 48,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
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
    fontWeight: '500',
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
    fontWeight: '500',
    color: colors.text.secondary,
  },
  scrollWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scrollFadeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollHint: {
    paddingBottom: spacing.xs,
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
    fontWeight: '500',
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
