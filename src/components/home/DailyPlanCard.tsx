import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import Icon from '../common/icons/Icon';

interface DailyPlanCardProps {
  duration?: string;
  streakDays?: number;
  onPress?: () => void;
}

export default function DailyPlanCard({
  duration = '2:00',
  streakDays = 7,
  onPress,
}: DailyPlanCardProps) {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (onPress) return onPress();
    navigation.navigate('DailyExercise');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Start your daily breath hold"
    >
      <View style={styles.iconCircle}>
        <Icon name="breath-hold" size={56} color={colors.primary.blue500} />
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>Daily action</Text>
        <Text style={styles.title}>Start your breath hold</Text>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="timer-outline" size={13} color={colors.text.secondary} />
          <Text style={styles.meta}>{duration}</Text>
          <View style={styles.dot} />
          <MaterialCommunityIcons name="fire" size={13} color={colors.orange[500]} />
          <Text style={styles.meta}>{`${streakDays} day streak`}</Text>
        </View>
      </View>

      <View style={styles.playCircle}>
        <MaterialCommunityIcons name="play" size={20} color={colors.text.inverse} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.96,
  },
  iconCircle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  eyebrow: {
    ...typography.label.small,
    color: colors.primary.blue600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '700',
  },
  title: {
    ...typography.title.title3,
    fontSize: 17,
    color: colors.text.primary,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  meta: {
    ...typography.label.small,
    color: colors.text.secondary,
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border.strong,
    marginHorizontal: 4,
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
