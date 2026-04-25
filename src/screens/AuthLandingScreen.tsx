import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

function showNotWiredAlert(provider: 'Apple' | 'Google') {
  Alert.alert(
    `${provider} sign-in not wired yet`,
    'This scaffold adds the auth landing screen and root gate. The provider handlers still need to be implemented.',
  );
}

export default function AuthLandingScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Azora</Text>
          <Text style={styles.title}>Breathe better. Measure better.</Text>
          <Text style={styles.subtitle}>
            Sign in once, then continue to onboarding or jump straight back into your progress.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => showNotWiredAlert('Apple')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonLabel}>Sign in with Apple</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => showNotWiredAlert('Google')}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonLabel}>Sign in with Google</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['3xl'],
  },
  hero: {
    gap: spacing.lg,
  },
  eyebrow: {
    color: colors.primary.blue600,
    fontFamily: 'Unbounded-SemiBold',
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontFamily: 'Unbounded-Bold',
    fontSize: 34,
    lineHeight: 42,
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: 'Nunito-Regular',
    fontSize: 17,
    lineHeight: 26,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.text.primary,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  primaryButtonLabel: {
    color: colors.text.inverse,
    fontFamily: 'Nunito-Bold',
    fontSize: 17,
  },
  secondaryButtonLabel: {
    color: colors.text.primary,
    fontFamily: 'Nunito-Bold',
    fontSize: 17,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
