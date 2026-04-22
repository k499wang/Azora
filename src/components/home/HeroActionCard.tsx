import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

interface HeroActionCardProps {
  title?: string;
  subtitle?: string;
  label?: string;
  onPress: () => void;
}

export default function HeroActionCard({ label = 'Start Breath Hold', onPress }: HeroActionCardProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  pill: {
    ...card.shadow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    backgroundColor: colors.background.elevated,
  },
  label: {
    ...typography.title.title3,
    fontSize: 13,
    color: colors.primary.blue600,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
});
