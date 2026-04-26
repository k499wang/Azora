import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon, { type IconName } from '../components/common/icons/Icon';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { spacing } from '../theme/spacing';

function showNotWiredAlert(provider: 'Apple' | 'Google') {
  Alert.alert(
    `${provider} sign-in not wired yet`,
    'This scaffold adds the auth landing screen and root gate. The provider handlers still need to be implemented.',
  );
}

interface FloatingIconConfig {
  name: IconName;
  size: number;
  color: string;
  top: number;
  left?: number;
  right?: number;
  rotate?: number;
}

const FLOATING_ICONS: FloatingIconConfig[] = [
  { name: 'sparkle', size: 22, color: colors.neutral[0], top: 12, left: 28 },
  { name: 'heart-glow', size: 38, color: colors.primary.blue100, top: 36, left: 8, rotate: -12 },
  { name: 'breath-hold', size: 44, color: colors.primary.blue700, top: 110, left: 30, rotate: -8 },
  { name: 'sparkle', size: 16, color: colors.primary.blue100, top: 90, right: 60 },
  { name: 'meditation', size: 36, color: colors.neutral[0], top: 30, right: 24, rotate: 10 },
  { name: 'timer', size: 30, color: colors.primary.blue100, top: 100, right: 14, rotate: 8 },
  { name: 'streak', size: 32, color: colors.orange[400], top: 160, right: 40, rotate: -6 },
  { name: 'sparkle', size: 14, color: colors.neutral[0], top: 180, left: 80 },
];

export default function AuthLandingScreen() {
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={styles.hero}>
          {FLOATING_ICONS.map((cfg, i) => (
            <View
              key={i}
              style={[
                styles.floating,
                {
                  top: cfg.top,
                  left: cfg.left,
                  right: cfg.right,
                  transform: cfg.rotate ? [{ rotate: `${cfg.rotate}deg` }] : undefined,
                },
              ]}
            >
              <Icon name={cfg.name} size={cfg.size} color={cfg.color} />
            </View>
          ))}

          <View style={styles.heroCenter}>
            <View style={styles.heroBlob}>
              <Icon name="breath-hold" size={120} color={colors.neutral[0]} />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <SafeAreaView edges={['bottom']} style={styles.sheetSafe}>
          <View style={styles.sheetContent}>
            <View style={styles.copy}>
              <Text style={styles.title}>Welcome to Azora</Text>
              <Text style={styles.subtitle}>Breathe better. Measure better.</Text>
            </View>

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
              <Pressable
                accessibilityRole="button"
                onPress={() => showNotWiredAlert('Apple')}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Icon name="apple" size={18} color={colors.text.inverse} />
                <Text style={styles.primaryButtonLabel}>Continue with Apple</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => showNotWiredAlert('Google')}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Icon name="google" size={18} />
                <Text style={styles.secondaryButtonLabel}>Continue with Google</Text>
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
    backgroundColor: colors.primary.blue500,
  },
  heroSafe: {
    flex: 1,
  },
  hero: {
    flex: 1,
    position: 'relative',
  },
  floating: {
    position: 'absolute',
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlob: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: colors.background.elevated,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    marginTop: -32,
  },
  sheetSafe: {},
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  copy: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
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
});
