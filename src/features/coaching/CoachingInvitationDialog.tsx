import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import CenterDialog from '../../components/common/CenterDialog';
import ChunkyButton, { CHUNKY_TONE_SOFT } from '../../components/common/ChunkyButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface CoachingInvitationDialogProps {
  visible: boolean;
  onExplore: () => void;
  /** "Not now", a tap outside, or the Android back button */
  onClose: () => void;
}

export default function CoachingInvitationDialog({
  visible,
  onExplore,
  onClose,
}: CoachingInvitationDialogProps) {
  return (
    <CenterDialog visible={visible} onClose={onClose}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Want more personal support?</Text>
        <Text style={styles.body}>
          Work one-on-one with an Azora coach on what matters to you. Get a personalized plan,
          weekly written support, and a monthly call for $79 USD/month, in addition to your Azora
          subscription.
        </Text>
      </ScrollView>
      <View style={styles.actions}>
        <ChunkyButton label="Explore coaching" shape="card" onPress={onExplore} />
        <ChunkyButton
          label="Not now"
          shape="card"
          tone={CHUNKY_TONE_SOFT}
          haptic="tap"
          onPress={onClose}
        />
      </View>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  title: {
    ...typography.heading.heading1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
