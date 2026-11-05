import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RootStackNavigationProp } from '../../app/navigation';
import ChunkyButton, {
  CHUNKY_TONE_NEUTRAL,
  CHUNKY_TONE_SOFT,
} from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

// A set width, so the button cannot push the card past the screen edge.
const ACTION_WIDTH = 76;

interface CoachingCardProps {
  surface: 'scrim' | 'white';
  /** shows the X; a card without it stays put */
  onDismiss?: () => void;
}

export default function CoachingCard({ surface, onDismiss }: CoachingCardProps) {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();

  return (
    <View style={[styles.row, surface === 'scrim' ? styles.scrim : styles.white]}>
      <Icon name="star-white-outline" size={44} color={colors.playful.amber.base} />
      <Text style={styles.title}>Want your own life coach?</Text>
      <ChunkyButton
        label="Start"
        accessibilityLabel="Start coaching"
        shape="card"
        tone={surface === 'scrim' ? CHUNKY_TONE_NEUTRAL : CHUNKY_TONE_SOFT}
        compact
        labelSize="medium"
        minHeight={36}
        haptic="tap"
        onPress={() => navigation.navigate('CoachingSurvey')}
        style={styles.action}
      />
      {onDismiss != null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss coaching offer"
          hitSlop={spacing.md}
          onPress={() => {
            triggerTapHaptic();
            onDismiss();
          }}
          style={styles.dismiss}
        >
          <Icon name="close" size={14} color={colors.text.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  scrim: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    backgroundColor: colors.coachingOffer.fill,
  },
  white: {
    ...card.base,
    ...card.shadow,
  },
  title: {
    ...typography.heading.heading1,
    flex: 1,
    lineHeight: 22,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  action: {
    alignSelf: 'center',
    width: ACTION_WIDTH,
  },
  dismiss: {
    width: spacing.lg,
    height: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.coachingOffer.dismissFill,
  },
});
