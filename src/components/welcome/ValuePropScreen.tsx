import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { ValuePropIllustration } from './ValuePropIllustration';

interface Props {
  onContinue: () => void;
  onSkip: () => void;
}

const TOTAL_DOTS = 3;
const ACTIVE_INDEX = 0;

export function ValuePropScreen({ onContinue, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const illustrationSize = Math.min(Dimensions.get('window').width * 0.7, 320);

  return (
    <View style={styles.root}>
      <View style={[styles.skip, { top: insets.top + spacing.sm }]}>
        <Pressable onPress={onSkip} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={[styles.copy, { paddingTop: insets.top + spacing['3xl'] }]}>
        <Text style={styles.eyebrow}>Vitals-backed breathwork</Text>
        <Text style={styles.headline}>Biohack your breath.</Text>
        <Text style={styles.subhead}>
          HRV-tracked protocols built for athletes and biohackers. Train recovery, focus, and resilience — in minutes a day.
        </Text>
      </View>

      <View style={styles.illustration} pointerEvents="none">
        <ValuePropIllustration size={illustrationSize} />
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === ACTIVE_INDEX && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
  },
  skip: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
  },
  skipText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  eyebrow: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.brand,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  headline: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 30,
    lineHeight: 38,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subhead: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[300],
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary.blue500,
  },
  cta: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 22,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    backgroundColor: colors.primary.blue700,
  },
  ctaText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
