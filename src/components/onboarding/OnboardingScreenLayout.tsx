import { Text } from '../common/Text';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, InteractionManager, Keyboard, KeyboardAvoidingView, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../common/icons/Icon';
import TypedText from './TypedText';
import { useOnboardingProgressValue } from './onboardingProgress';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing as motionEasing } from '../../theme/motion';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { pauseSessionReplay } from '../../services/analytics/sessionReplay';
import {
  centeredBodyMinHeight,
  hasScrollOverflow,
} from '../../lib/ui/scrollOverflow';
import { useWhileVisible } from '../../hooks/useWhileVisible';

const ENTRANCE_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const ENTRANCE_INITIAL_SCALE = 0.992;
/** wide enough for "Skip", and reserved on both sides so the bar stays centred */
const NAV_SLOT_WIDTH = 44;

interface OnboardingScreenLayoutProps {
  title: string;
  subtitle?: string;
  /** stands in for the title block — the screen's own question, asked its way */
  titleSlot?: ReactNode;
  /** omit on a screen that is not a step, and the bar is left off entirely */
  progress?: number;
  onBack?: () => void;
  onSkip?: () => void;
  footer: ReactNode;
  children: ReactNode;
  keyboardAvoiding?: boolean;
  centerBody?: boolean;
  centerOnScreen?: boolean;
  centerCopy?: boolean;
  /** type the title in a character at a time, for the story beats */
  typeTitle?: boolean;
  copyBadge?: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  animateCopy?: boolean;
  disableEntranceAnimation?: boolean;
  enableNavigationHaptics?: boolean;
}

export default function OnboardingScreenLayout({
  title,
  subtitle,
  titleSlot,
  progress,
  onBack,
  onSkip,
  footer,
  children,
  keyboardAvoiding = false,
  centerBody = false,
  centerOnScreen = false,
  centerCopy = false,
  typeTitle = false,
  copyBadge,
  titleStyle,
  animateCopy = false,
  disableEntranceAnimation = false,
  enableNavigationHaptics = true,
}: OnboardingScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const clampedProgress =
    progress === undefined ? undefined : Math.max(0, Math.min(1, progress));
  // The nav row always keeps its height, so the copy below it sits at the same
  // vertical position whether or not a screen has a back or skip action.
  const fade = useRef(
    new Animated.Value(disableEntranceAnimation ? 1 : 0),
  ).current;
  const scale = useRef(
    new Animated.Value(
      disableEntranceAnimation ? 1 : ENTRANCE_INITIAL_SCALE,
    ),
  ).current;
  const titleEnter = useRef(
    new Animated.Value(disableEntranceAnimation || !animateCopy ? 1 : 0),
  ).current;
  const subtitleEnter = useRef(
    new Animated.Value(disableEntranceAnimation || !animateCopy ? 1 : 0),
  ).current;
  const scrollRef = useRef<ScrollView>(null);

  // centerBody centres the body inside its own box, which sits lower than the
  // screen's centre because the header block is taller than the footer. Measure
  // both and pad the short side so the centred content lands on the true middle
  // of the phone. Heights come from layout, so this settles without a transform.
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const blockDelta = insets.top + headerHeight - footerHeight;
  const screenCenterStyle =
    centerOnScreen && headerHeight > 0 && footerHeight > 0
      ? blockDelta >= 0
        ? { paddingBottom: blockDelta }
        : { paddingTop: -blockDelta }
      : null;

  const scrollFade = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const [centeredBodyHeight, setCenteredBodyHeight] = useState(0);
  const [viewport, setViewport] = useState(0);
  const centeredBodyBox = centeredBodyMinHeight({
    centerBody,
    bodyHeight: centeredBodyHeight,
    viewportHeight: viewport,
    // screenCenterStyle pads the overlay, so the box has to clear that too or
    // the padding eats back into the body it was grown to hold.
    centerPadding: screenCenterStyle ? Math.abs(blockDelta) : 0,
  });
  const centeredBodyStyle =
    centeredBodyBox == null ? null : { minHeight: centeredBodyBox };

  useWhileVisible(() => {
    bounce.setValue(0);
    if (!hasOverflow) {
      return () => {};
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
    const overflow = hasScrollOverflow(
      contentHeight.current,
      viewportHeight.current,
    );
    setHasOverflow(overflow);
    setFadeVisible(overflow);
  };

  const handleViewportLayout = (event: LayoutChangeEvent) => {
    viewportHeight.current = event.nativeEvent.layout.height;
    setViewport(event.nativeEvent.layout.height);
    recomputeOverflow();
  };

  const handleCenteredBodyLayout = (event: LayoutChangeEvent) => {
    setCenteredBodyHeight(event.nativeEvent.layout.height);
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
    if (disableEntranceAnimation) return;

    let animation: Animated.CompositeAnimation | null = null;
    const resumeReplay = pauseSessionReplay();

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
        ...(animateCopy
          ? [
              Animated.timing(titleEnter, {
                toValue: 1,
                duration: 640,
                easing: ENTRANCE_EASING,
                useNativeDriver: true,
              }),
              Animated.timing(subtitleEnter, {
                toValue: 1,
                duration: 640,
                delay: 220,
                easing: ENTRANCE_EASING,
                useNativeDriver: true,
              }),
            ]
          : []),
      ]);
      animation.start(resumeReplay);
    });

    return () => {
      handle.cancel();
      animation?.stop();
      resumeReplay();
    };
  }, [animateCopy, disableEntranceAnimation, fade, scale, subtitleEnter, titleEnter]);

  const handleBack = () => {
    if (!onBack) return;
    if (enableNavigationHaptics && isHapticsEnabled()) {
      Haptics.selectionAsync().catch(() => {});
    }
    onBack();
  };

  const handleSkip = () => {
    if (!onSkip) return;
    if (enableNavigationHaptics && isHapticsEnabled()) {
      Haptics.selectionAsync().catch(() => {});
    }
    onSkip();
  };

  const inner = (
    <Animated.View style={[styles.entrance, { opacity: fade }]}>
      <View
        style={styles.header}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        {/* Both slots keep their width whether or not they hold a button, so the
            bar is inset by the same amount on either side on every screen —
            collapsing the empty side is what made the spacing wander. */}
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

        {clampedProgress === undefined ? (
          <View style={styles.progressBarSpacer} />
        ) : (
          <ProgressBar progress={clampedProgress} />
        )}

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
          scrollEnabled={hasOverflow}
          showsVerticalScrollIndicator={hasOverflow}
          bounces={hasOverflow}
          overScrollMode={hasOverflow ? 'always' : 'never'}
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
              centeredBodyStyle,
              { transform: [{ scale }] },
            ]}
          >
            {titleSlot ? (
              <View style={styles.copy}>{titleSlot}</View>
            ) : title ? (
              <View style={styles.copy}>
                <Animated.View
                  style={{
                    opacity: titleEnter,
                    transform: [
                      {
                        translateY: titleEnter.interpolate({
                          inputRange: [0, 1],
                          outputRange: [18, 0],
                        }),
                      },
                    ],
                  }}
                >
                  {copyBadge ? (
                    <View style={centerCopy ? styles.badgeCentered : styles.badge}>
                      {copyBadge}
                    </View>
                  ) : null}
                  {typeTitle ? (
                    <TypedText
                      text={title}
                      style={[
                        styles.title,
                        centerCopy && styles.centeredCopy,
                        titleStyle,
                      ]}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.title,
                        centerCopy && styles.centeredCopy,
                        titleStyle,
                      ]}
                    >
                      {title}
                    </Text>
                  )}
                </Animated.View>
                {subtitle ? (
                  <Animated.View
                    style={{
                      opacity: subtitleEnter,
                      transform: [
                        {
                          translateY: subtitleEnter.interpolate({
                            inputRange: [0, 1],
                            outputRange: [14, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <Text
                      style={[styles.subtitle, centerCopy && styles.centeredCopy]}
                    >
                      {subtitle}
                    </Text>
                  </Animated.View>
                ) : null}
              </View>
            ) : null}

            {centerBody ? (
              <View
                style={[styles.bodyCenteredOverlay, screenCenterStyle]}
                pointerEvents="box-none"
              >
                <View
                  style={styles.bodyCenteredInner}
                  onLayout={handleCenteredBodyLayout}
                >
                  {children}
                </View>
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
            colors={[`${colors.background.canvas}00`, colors.background.canvas]}
            style={styles.scrollFadeGradient}
          />
          <Animated.View
            style={[styles.scrollHint, { transform: [{ translateY: bounce }] }]}
          >
            <Icon name="chevron-down" size={22} color={colors.text.tertiary} />
          </Animated.View>
        </Animated.View>
      </View>

      <View
        style={[
          styles.bottom,
          // The safe area's bottom inset was never applied, so the footer sat
          // spacing.lg from the physical edge and ran under the home indicator's
          // 34pt reserved band. Take whichever is larger.
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
        onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
      >
        {footer}
      </View>
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

/**
 * The bar, animated on the UI thread.
 *
 * The value comes from the flow rather than from this component, so it survives
 * the screen swap between steps and the bar slides on every screen instead of
 * jumping on some — see `onboardingProgress`.
 */
function ProgressBar({ progress }: { progress: number }) {
  const shared = useOnboardingProgressValue();
  // A screen rendered outside the flow still gets a bar; it just starts at rest.
  const fallback = useSharedValue(progress);
  const value = shared ?? fallback;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      value.value = progress;
      return undefined;
    }

    value.value = withTiming(progress, {
      duration: duration.slow,
      easing: motionEasing.settle,
    });

    // Stops the tween when this screen goes away. The next screen picks the
    // value up where this one left it, so nothing is left running behind it.
    return () => cancelAnimation(value);
  }, [progress, reducedMotion, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${value.value * 100}%`,
  }));

  return (
    <View style={styles.progressBar}>
      <Reanimated.View style={[styles.progressFill, fillStyle]} />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerSlotLeft: {
    width: NAV_SLOT_WIDTH,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSlotRight: {
    width: NAV_SLOT_WIDTH,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  progressBarSpacer: {
    flex: 1,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary.blue200,
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
  // No horizontal padding: the slot is already the tap target's width, and
  // padding here would push "Skip" off the screen's right margin. `hitSlop`
  // covers the touch area.
  skipButton: {
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
  // An absolutely positioned child is laid out against its parent's padding
  // *edge*, so `left: 0` here starts where `content`'s side padding starts —
  // the centred body spanned the full screen while the title above it was
  // inset, and anything full-width in it ran past the screen's margins. The
  // same padding again puts the two back on one grid.
  bodyCenteredOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  bodyCenteredInner: {
    width: '100%',
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  centeredCopy: {
    textAlign: 'center',
  },
  // The scroll view clips to its bounds, so the badge needs headroom above it
  // or an entrance that overshoots its resting size gets cut off at the top.
  badge: {
    alignItems: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  badgeCentered: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  // Scrolling screens end flush against the footer without this, so the last
  // card and the primary button sit almost touching at full scroll.
  body: {
    flex: 1,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
