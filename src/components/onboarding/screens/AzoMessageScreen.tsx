import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import AzoGreeting from '../AzoGreeting';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { colors } from '../../../theme/colors';
import { scaleVisual } from '../onboardingVisualScale';
import { contentColumn, isShortScreen } from '../../../theme/breakpoints';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType } from '../../../theme/typography';
import { AzoChatAvatar, azoChatColors } from '../AzoChatChrome';
import { useAzoMessageEntrance } from '../useAzoMessageEntrance';
import { travel } from '../../../theme/motion';

interface AzoMessageScreenProps {
  onContinue: () => void;
}

export default function AzoMessageScreen({ onContinue }: AzoMessageScreenProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const entered = useRef(false);
  const { progress, ready } = useAzoMessageEntrance();
  const [titleHeight, setTitleHeight] = useState(40);
  const [promptHeight, setPromptHeight] = useState(58);
  const [mascotHeight, setMascotHeight] = useState(0);
  const compact = isShortScreen(height);
  const mascotWidth = Math.min(
    width - spacing.md * 2,
    scaleVisual(290),
    Math.max(0, mascotHeight - titleHeight - spacing.md * 2) * (600 / 578),
  );
  const notificationOpacity = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 1] });
  const notificationTranslate = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [-spacing.xl, 0, 0] });
  const promptOpacity = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, 1] });
  const promptTranslate = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [travel.rise, travel.rise, 0] });

  const openChat = () => {
    if (!ready || entered.current) return;
    entered.current = true;
    onContinue();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.content, styles.body]}>
        <Animated.View
          style={{ opacity: notificationOpacity, transform: [{ translateY: notificationTranslate }] }}
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
              <View style={styles.messageBadge}>
                <Icon name="message" size={15} color={colors.text.inverse} />
              </View>
            </View>
            <View style={styles.notificationCopy}>
              <Text style={styles.notificationName}>Azo</Text>
              <Text style={styles.notificationMessage}>Hey, we need to talk.</Text>
            </View>
            <Text style={styles.now}>Now</Text>
          </Pressable>
        </Animated.View>

        <View style={[styles.copySlot, { height: promptHeight }]}>
          <Animated.View
            style={[styles.copyLayer, styles.prompt, { opacity: promptOpacity, transform: [{ translateY: promptTranslate }] }]}
            onLayout={({ nativeEvent }) => setPromptHeight(nativeEvent.layout.height)}
            accessibilityElementsHidden={!ready}
            importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
            pointerEvents="none"
          >
            <View style={styles.arrow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Icon name="arrow-up" size={28} color={azoChatColors.ink} />
            </View>
            <Text style={[styles.promptText, compact && styles.compactPrompt]}>Azo sent you a message,{ '\n' }tap on it</Text>
          </Animated.View>
        </View>

        <View style={styles.mascot} onLayout={({ nativeEvent }) => setMascotHeight(nativeEvent.layout.height)}>
          <Text
            accessibilityRole="header"
            onLayout={({ nativeEvent }) => setTitleHeight(nativeEvent.layout.height)}
            style={[styles.title, compact && styles.compactTitle]}
          >
            Let’s talk about you.
          </Text>
          {mascotWidth > 0 ? <AzoGreeting width={mascotWidth} /> : null}
        </View>
      </View>

      <Animated.View
        style={[styles.content, styles.footer, { opacity: promptOpacity, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        pointerEvents={ready ? 'auto' : 'none'}
        accessibilityElementsHidden={!ready}
        importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
      >
        <Text style={styles.invitation}>This is personal.</Text>
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
  copyLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  title: { alignSelf: 'stretch', marginBottom: spacing.md, fontFamily: fonts.semibold, fontSize: scaleType(34), lineHeight: scaleType(40), color: azoChatColors.ink, textAlign: 'center' },
  compactTitle: { fontSize: scaleType(30), lineHeight: scaleType(36) },
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
  mascot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: { gap: spacing.md, paddingTop: spacing.md },
  invitation: { textAlign: 'center', fontSize: scaleType(22), lineHeight: scaleType(28), color: azoChatColors.muted },
  pressed: { opacity: 0.65 },
});
