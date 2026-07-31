import { Text } from '../common/Text';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, InteractionManager, Keyboard, KeyboardAvoidingView, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleProp, StyleSheet, TextStyle, View } from 'react-native';
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
  centerOnScreen?: boolean;
  centerCopy?: boolean;
  copyBadge?: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  fullWidthProgress?: boolean;
  hideProgress?: boolean;
  animateCopy?: boolean;
  disableEntranceAnimation?: boolean;
  enableNavigationHaptics?: boolean;
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
  centerOnScreen = false,
  centerCopy = false,
  copyBadge,
  titleStyle,
  fullWidthProgress = false,
  hideProgress = false,
  animateCopy = false,
  disableEntranceAnimation = false,
  enableNavigationHaptics = true,
}: OnboardingScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const clampedProgress = Math.max(0, Math.min(1, progress));
  // First step runs the bar full width; every other step reserves the back and
  // skip slots so the bar stays put even on screens that have no skip action.
  // The slots always keep their height so the bar sits at the same vertical
  // position on every screen — only their width collapses.
  const showNavSlots = !fullWidthProgress;
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
    if (disableEntranceAnimation) return;

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
      animation.start();
    });

    return () => {
      handle.cancel();
      animation?.stop();
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
        <View
          style={[
            styles.headerSlotLeft,
            !showNavSlots && styles.headerSlotCollapsed,
          ]}
        >
          {showNavSlots && onBack ? (
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
        {hideProgress ? (
          <View style={styles.progressSpacer} />
        ) : (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]} />
          </View>
        )}
        <View
          style={[
            styles.headerSlotRight,
            !showNavSlots && styles.headerSlotCollapsed,
          ]}
        >
          {showNavSlots && onSkip ? (
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
                  <Text
                    style={[
                      styles.title,
                      centerCopy && styles.centeredCopy,
                      titleStyle,
                    ]}
                  >
                    {title}
                  </Text>
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
    paddingBottom: spacing['2xl'],
  },
  headerSlotLeft: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerSlotRight: {
    width: 48,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  // Keeps the 32pt row height so the bar never shifts vertically between
  // screens, while letting it run edge to edge.
  headerSlotCollapsed: {
    width: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary.blue200,
    overflow: 'hidden',
  },
  // Holds the bar's slot open so hiding it doesn't move anything else.
  progressSpacer: {
    flex: 1,
    height: 6,
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
