import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import AzoGreeting from '../AzoGreeting';
import PopInWords from '../PopInWords';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { colors } from '../../../theme/colors';
import { scaleVisual } from '../onboardingVisualScale';
import { contentColumn, isShortScreen } from '../../../theme/breakpoints';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType } from '../../../theme/typography';
import { AzoChatAvatar, azoChatColors } from '../AzoChatChrome';
import { useAzoMessageEntrance } from '../useAzoMessageEntrance';
import { GREETING_DRAWN_SHARE, GREETING_HEADROOM } from '../greetingAnimation';
import { duration, travel } from '../../../theme/motion';

interface AzoMessageScreenProps {
  onContinue: () => void;
}

/** Azo introduces himself, then says what the conversation is about. */
const GREETING_LINE = 'Hey, I’m Azo! Nice to meet you.';
const HEADLINE_LINE = 'It’s finally time to talk about what’s happening to us.';

/** The greeting artwork's frame, so a height budget can be turned into a width. */
const GREETING_ASPECT = 600 / 578;

/** The widest Azo is ever drawn, however much room the body leaves him. */
const MAX_GREETING_WIDTH = 330;

/** The breath kept between the copy and the top of Azo's drawn body. */
const GREETING_CLEARANCE = spacing.md;

/** The breath kept under his drawn feet, above the footer. */
const GREETING_FOOTROOM = spacing.sm;

export default function AzoMessageScreen({ onContinue }: AzoMessageScreenProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const entered = useRef(false);
  const reducedMotion = useReducedMotion();
  const enter = useRef(new Animated.Value(0)).current;
  const arrow = useRef(new Animated.Value(0)).current;
  const [greetingHeight, setGreetingHeight] = useState(0);
  const [headlineHeight, setHeadlineHeight] = useState(0);
  const [promptHeight, setPromptHeight] = useState(58);
  const [mascotHeight, setMascotHeight] = useState(0);
  const [mascotDisplayed, setMascotDisplayed] = useState(false);
  const compact = isShortScreen(height);

  // The taller of the two lines is the one the lines' own place has to hold:
  // both are drawn in the same spot, above Azo, as they hand over to each other.
  const lineSlotHeight = Math.max(greetingHeight, headlineHeight);

  // One slot holds the whole of the copy. The lines are read in it and the
  // prompt then arrives in the same place, so the space a message was read in is
  // the space the invitation takes — nothing is left as an empty box for Azo to
  // sit below, and he keeps the whole body under the copy either way.
  const copySlotHeight = Math.max(lineSlotHeight, promptHeight);

  // Azo stands directly under the copy: his drawing takes the height between
  // that slot and the footer, so the air the body has left sits under him rather
  // than over his head. The frame around the drawing is pulled up by the empty
  // headroom at its top, because it is the drawing that lands a breath under the
  // copy, not the box it is exported in. A body too short to hold him draws
  // nothing.
  const frameHeight =
    mascotHeight <= 0
      ? 0
      : Math.min(
          (width - spacing.md * 2) / GREETING_ASPECT,
          scaleVisual(MAX_GREETING_WIDTH) / GREETING_ASPECT,
          Math.max(0, mascotHeight - GREETING_CLEARANCE - GREETING_FOOTROOM) /
            GREETING_DRAWN_SHARE,
        );
  const mascotWidth = lineSlotHeight <= 0 ? 0 : frameHeight * GREETING_ASPECT;
  const mascotLift = GREETING_CLEARANCE - frameHeight * GREETING_HEADROOM;

  // Nothing enters before the artwork has painted: the greeting decodes for a
  // moment after mount, and playing the entrance before it lands is what left
  // the copy on screen ahead of Azo. A body with no room to draw him in has no
  // artwork to wait for.
  const measured = mascotHeight > 0 && lineSlotHeight > 0;
  const artworkSettled = mascotDisplayed || (measured && mascotWidth <= 0);
  const { progress, arrival, phase, ready } = useAzoMessageEntrance(artworkSettled);
  const settled = phase === 'ready';

  useEffect(() => {
    if (!artworkSettled) return;
    if (reducedMotion) {
      enter.setValue(1);
      return;
    }
    const rise = Animated.timing(enter, {
      toValue: 1,
      duration: duration.slow,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
      isInteraction: false,
    });
    rise.start();
    return () => rise.stop();
  }, [artworkSettled, enter, reducedMotion]);

  // The hint breathes while it waits for the tap — but only once the entrance
  // has settled, since a loop that starts while the prompt is still rising puts
  // two motions on the same element, which reads as a stutter.
  useWhileVisible(
    () => {
      arrow.setValue(0);
      if (!settled || reducedMotion) return () => {};
      const bob = Animated.loop(
        Animated.sequence([
          Animated.timing(arrow, {
            toValue: 1,
            duration: duration.beat,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(arrow, {
            toValue: 0,
            duration: duration.beat,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
            isInteraction: false,
          }),
        ]),
      );
      bob.start();
      return () => bob.stop();
    },
    [arrow, settled, reducedMotion],
  );

  const enterRise = enter.interpolate({ inputRange: [0, 1], outputRange: [travel.rise, 0] });
  // `progress` counts the entrance's steps — 1 the headline, 3 the notification,
  // 5 the prompt. Steps 2 and 4 are the beats each message is left to be read in,
  // so every range below holds its value across them and the copy stands still.
  const notificationOpacity = progress.interpolate({ inputRange: [0, 2, 3], outputRange: [0, 0, 1], extrapolate: 'clamp' });
  const notificationTranslate = progress.interpolate({ inputRange: [0, 2, 3], outputRange: [-spacing['2xl'], -spacing['2xl'], 0], extrapolate: 'clamp' });
  // The headline leaves on step 5 and the prompt arrives on step 6, so the two
  // hand over instead of crossing over each other.
  const promptOpacity = progress.interpolate({ inputRange: [0, 5, 6], outputRange: [0, 0, 1], extrapolate: 'clamp' });
  const promptTranslate = progress.interpolate({ inputRange: [0, 5, 6], outputRange: [travel.rise, travel.rise, 0], extrapolate: 'clamp' });
  // The greeting hands over to the headline, and the headline hands the screen
  // to the prompt. Reduced motion plays neither handover, so the line that names
  // what this is stays rather than leaving unread.
  const greetingOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  const greetingExit = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -travel.rise], extrapolate: 'clamp' });
  // The headline's words pop in on their own; this only carries it out again.
  const headlineOpacity = reducedMotion
    ? 1
    : progress.interpolate({ inputRange: [0, 4, 5], outputRange: [1, 1, 0], extrapolate: 'clamp' });
  const headlineExit = reducedMotion
    ? 0
    : progress.interpolate({ inputRange: [0, 4, 5], outputRange: [0, 0, -travel.rise], extrapolate: 'clamp' });
  // The recoil the card takes as it lands, after the fall it made on the buzz: a
  // small overshoot in size and a quick side-to-side settle.
  const arrivalScale = arrival.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.95, 1.02, 1], extrapolate: 'clamp' });
  const arrivalShift = arrival.interpolate({ inputRange: [0, 0.14, 0.38, 0.62, 0.84, 1], outputRange: [0, -8, 6, -4, 2, 0], extrapolate: 'clamp' });
  const arrivalTilt = arrival.interpolate({ inputRange: [0, 0.14, 0.38, 0.62, 1], outputRange: ['0deg', '-2.2deg', '1.4deg', '-0.7deg', '0deg'], extrapolate: 'clamp' });
  const badgeScale = arrival.interpolate({ inputRange: [0, 0.86, 1], outputRange: [0.5, 1.1, 1], extrapolate: 'clamp' });
  const arrowLift = arrow.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const openChat = () => {
    if (!ready || entered.current) return;
    entered.current = true;
    onContinue();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Animated.View
        style={[styles.content, styles.body, { opacity: enter, transform: [{ translateY: enterRise }] }]}
      >
        <Animated.View
          style={{
            opacity: notificationOpacity,
            transform: [
              { translateY: notificationTranslate },
              { translateX: arrivalShift },
              { rotate: arrivalTilt },
              { scale: arrivalScale },
            ],
          }}
          pointerEvents={ready ? 'auto' : 'none'}
          accessibilityElementsHidden={!ready}
          importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
        >
          <Pressable
            onPress={openChat}
            disabled={!ready}
            accessibilityRole="button"
            accessibilityLabel="Open Azo’s message: Hey, we need to talk."
            style={({ pressed }) => [styles.notification, pressed && styles.pressed]}
          >
            <View>
              <AzoChatAvatar size={42} />
              <Animated.View style={[styles.messageBadge, { transform: [{ scale: badgeScale }] }]}>
                <Icon name="message" size={15} color={colors.text.inverse} />
              </Animated.View>
            </View>
            <View style={styles.notificationCopy}>
              <Text style={styles.notificationName}>Azo</Text>
              <Text style={styles.notificationMessage}>Hey, we need to talk.</Text>
            </View>
            <Text style={styles.now}>Now</Text>
          </Pressable>
        </Animated.View>

        <View style={[styles.copySlot, { height: copySlotHeight }]}>
          <Animated.View
            onLayout={({ nativeEvent }) => setGreetingHeight(nativeEvent.layout.height)}
            style={[styles.lineFrame, { opacity: greetingOpacity, transform: [{ translateY: greetingExit }] }]}
          >
            <PopInWords
              text={GREETING_LINE}
              play={artworkSettled}
              reducedMotion={reducedMotion}
              textStyle={[styles.lineText, compact && styles.compactLine]}
            />
          </Animated.View>
          <Animated.View
            onLayout={({ nativeEvent }) => setHeadlineHeight(nativeEvent.layout.height)}
            style={[styles.lineFrame, { opacity: headlineOpacity, transform: [{ translateY: headlineExit }] }]}
          >
            <PopInWords
              text={HEADLINE_LINE}
              accessibilityRole="header"
              play={phase !== 'title'}
              reducedMotion={reducedMotion}
              textStyle={[styles.lineText, compact && styles.compactLine]}
            />
          </Animated.View>

          <Animated.View
            style={[styles.copyLayer, { opacity: promptOpacity, transform: [{ translateY: promptTranslate }] }]}
            accessibilityElementsHidden={!ready}
            importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
            pointerEvents="none"
          >
            <View
              style={styles.prompt}
              onLayout={({ nativeEvent }) => setPromptHeight(nativeEvent.layout.height)}
            >
              <Animated.View
                style={[styles.arrow, { transform: [{ translateY: arrowLift }] }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Icon name="arrow-up" size={28} color={azoChatColors.ink} />
              </Animated.View>
              <Text style={[styles.promptText, compact && styles.compactPrompt]}>Azo sent you a message,{ '\n' }tap on it</Text>
            </View>
          </Animated.View>
        </View>

        <View
          style={styles.mascot}
          onLayout={({ nativeEvent }) => setMascotHeight(nativeEvent.layout.height)}
        >
          {mascotWidth > 0 ? (
            <View style={{ marginTop: mascotLift }}>
              <AzoGreeting width={mascotWidth} onReady={() => setMascotDisplayed(true)} />
            </View>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View
        style={[styles.content, styles.footer, { opacity: promptOpacity, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        pointerEvents={ready ? 'auto' : 'none'}
        accessibilityElementsHidden={!ready}
        importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
      >
        <Text style={styles.invitation}>This is personal. I’ll send you a text message.</Text>
        <OnboardingPrimaryButton label="Chat with Azo" onPress={openChat} disabled={!ready} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azoChatColors.background },
  content: { ...contentColumn, paddingHorizontal: spacing.md },
  body: { flex: 1, paddingTop: spacing.md },
  copySlot: { marginTop: spacing.lg },
  // The prompt sits at the top of the slot, pulled up toward the notification
  // its arrow points at.
  copyLayer: { position: 'absolute', top: spacing.md - spacing.lg, bottom: 0, left: 0, right: 0 },
  lineFrame: { position: 'absolute', top: 0, left: 0, right: 0 },
  lineText: {
    fontFamily: fonts.semibold,
    fontSize: scaleType(34),
    lineHeight: scaleType(40),
    color: azoChatColors.ink,
    textAlign: 'center',
  },
  compactLine: { fontSize: scaleType(30), lineHeight: scaleType(36) },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: azoChatColors.card,
    shadowColor: colors.shadowInk,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    shadowOpacity: 0.08,
    elevation: 4,
  },
  notificationCopy: { flex: 1, gap: 2 },
  notificationName: { fontFamily: fonts.semibold, fontSize: scaleType(18), color: azoChatColors.ink },
  notificationMessage: { fontSize: scaleType(13), lineHeight: scaleType(18), color: azoChatColors.ink },
  now: { fontSize: scaleType(12), color: azoChatColors.muted },
  messageBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 23,
    height: 23,
    borderRadius: 6,
    backgroundColor: azoChatColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  arrow: { paddingTop: spacing.xs },
  promptText: { flex: 1, fontSize: scaleType(23), lineHeight: scaleType(29), color: azoChatColors.ink },
  compactPrompt: { fontSize: scaleType(21), lineHeight: scaleType(27) },
  // The drawing is placed from the top of the band: whatever the body leaves
  // unused sits below Azo, above the button, rather than lifting him off the
  // copy he is standing under.
  mascot: { flex: 1, justifyContent: 'flex-start', alignItems: 'center' },
  footer: { gap: spacing.md, paddingTop: spacing.md },
  invitation: { textAlign: 'center', fontSize: scaleType(22), lineHeight: scaleType(28), color: azoChatColors.muted },
  pressed: { opacity: 0.65 },
});
