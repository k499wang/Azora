import { Text } from '../common/Text';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

/*
  Presentational mockup of the auth landing screen
  rendered inside PhoneFrame for the onboarding carousel.
*/

export default function LoginScreenMockup() {
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Azora</Text>
        <Text style={styles.tagline}>Breathe. Measure. Recover.</Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.actions}>
          <View style={styles.primaryButton}>
            <Text style={styles.primaryLabel}>Continue with Apple</Text>
          </View>
          <View style={styles.secondaryButton}>
            <Text style={styles.secondaryLabel}>Continue with Google</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  brand: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 32,
    color: colors.text.primary,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text.secondary,
  },
  sheet: {
    backgroundColor: colors.background.elevated,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
  primaryLabel: {
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 16,
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
  secondaryLabel: {
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 16,
  },
});
