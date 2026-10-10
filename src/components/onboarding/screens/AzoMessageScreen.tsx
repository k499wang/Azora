import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import AzoPortrait from '../../../features/mascot/AzoPortrait';
import { contentColumn } from '../../../theme/breakpoints';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType } from '../../../theme/typography';
import { AzoChatAvatar, AzoChatBackButton, azoChatColors } from '../AzoChatChrome';

interface AzoMessageScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

export default function AzoMessageScreen({ onContinue, onBack }: AzoMessageScreenProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const entered = useRef(false);

  const openChat = () => {
    if (entered.current) return;
    entered.current = true;
    onContinue();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.content, styles.navigation]}>
        {onBack ? <AzoChatBackButton onPress={onBack} /> : null}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, styles.body]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={openChat}
          accessibilityRole="button"
          accessibilityLabel="Open Azo’s message: Hey, we need to talk."
          style={({ pressed }) => [styles.notification, pressed && styles.pressed]}
        >
          <View>
            <AzoChatAvatar size={42} />
            <View style={styles.messageBadge}>
              <Icon name="message" size={15} color={azoChatColors.background} />
            </View>
          </View>
          <View style={styles.notificationCopy}>
            <Text style={styles.notificationName}>Azo</Text>
            <Text style={styles.notificationMessage}>Hey, we need to talk.</Text>
          </View>
          <Text style={styles.now}>Now</Text>
        </Pressable>

        <View style={styles.prompt}>
          <View style={styles.arrow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Icon name="arrow-up" size={28} color={azoChatColors.ink} />
          </View>
          <Text style={styles.promptText}>Azo sent you a message,{ '\n' }tap on it</Text>
        </View>

        <View style={[styles.mascot, { minHeight: height < 700 ? 205 : 285 }]}>
          <View accessible accessibilityLabel="Azo is ready to chat">
            <AzoPortrait size={height < 700 ? 165 : 210} expression="thinking" active={false} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.content, styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Text style={styles.invitation}>This is personal.{ '\n' }Let’s talk about you.</Text>
        <Pressable
          onPress={openChat}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>Chat with Azo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azoChatColors.background },
  content: { ...contentColumn, paddingHorizontal: spacing.md },
  navigation: { minHeight: 60, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  scroll: { flex: 1 },
  body: { flexGrow: 1, paddingTop: spacing.md },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: azoChatColors.background,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    shadowOpacity: 0.08,
    elevation: 4,
    marginBottom: spacing.xl,
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
    backgroundColor: azoChatColors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  arrow: { paddingTop: spacing.xs },
  promptText: { flex: 1, fontSize: scaleType(23), lineHeight: scaleType(29), color: azoChatColors.ink },
  mascot: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.lg },
  footer: { gap: spacing.md, paddingTop: spacing.md },
  invitation: { textAlign: 'center', fontSize: scaleType(22), lineHeight: scaleType(28), color: azoChatColors.muted },
  button: {
    minHeight: 68,
    backgroundColor: azoChatColors.green,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: azoChatColors.greenLip,
    borderBottomWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  buttonLabel: { fontFamily: fonts.semibold, fontSize: scaleType(26), color: azoChatColors.background },
  buttonPressed: { opacity: 0.8, transform: [{ translateY: 2 }] },
  pressed: { opacity: 0.65 },
});
