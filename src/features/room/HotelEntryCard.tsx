/**
 * The way from the profile to every room so far.
 *
 * The hotel used to be a main tab, which gave a page the user visits rarely
 * the same standing as the day's work. It lives one press off the profile now,
 * above the consistency calendar — the other place the app keeps a record of
 * what has already happened.
 *
 * An ordinary white card, like everything else on the page — the pyramid in
 * the app's blue is what marks it as the door to somewhere else.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { MainTabNavigationProp } from '../../app/navigation';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

const ICON_SIZE = 32;
const CHEVRON_SIZE = 18;

export default function HotelEntryCard() {
  const navigation = useNavigation<MainTabNavigationProp<'Profile'>>();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="View Azo's house"
      onPress={() => {
        triggerTapHaptic();
        navigation.navigate('Hotel');
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>View Azo's house</Text>
        <Text style={styles.subtitle}>See your progress!</Text>
      </View>
      <Icon
        name="hotel-pyramid"
        size={ICON_SIZE}
        color={colors.playful.sky.base}
      />
      <Icon
        name="chevron-right"
        size={CHEVRON_SIZE}
        color={colors.text.tertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Shaped and lifted like the calendar under it, so the two read as one run
  // of cards rather than two card styles.
  row: {
    ...card.blockShadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowPressed: {
    opacity: 0.85,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
});
