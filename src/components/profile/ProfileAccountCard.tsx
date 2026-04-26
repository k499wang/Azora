import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

interface ProfileAccountCardProps {
  onDeleteAccount?: () => void;
  onManageSubscription?: () => void;
}

const APPLE_GUIDELINE_NOTES = [
  'Start account deletion inside the app, not only on a website.',
  'Explain that deleting an account does not automatically cancel Apple billing.',
  'Finish removing the user record and app data after a confirmation step.',
];

export default function ProfileAccountCard({
  onDeleteAccount,
  onManageSubscription,
}: ProfileAccountCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Account & privacy</Text>
        </View>
      </View>

      <View style={styles.notesWrap}>
        {APPLE_GUIDELINE_NOTES.map((note) => (
          <View key={note} style={styles.noteRow}>
            <MaterialCommunityIcons
              name="check-decagram-outline"
              size={16}
              color={colors.primary.blue600}
            />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttonGroup}>
        <Pressable
          onPress={onManageSubscription}
          disabled={onManageSubscription == null}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && onManageSubscription != null && styles.buttonPressed,
            onManageSubscription == null && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Manage subscription</Text>
        </Pressable>

        <Pressable
          onPress={onDeleteAccount}
          disabled={onDeleteAccount == null}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && onDeleteAccount != null && styles.buttonPressed,
            onDeleteAccount == null && styles.buttonDisabled,
          ]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.text.inverse} />
          <Text style={styles.deleteButtonText}>Delete account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    gap: spacing.xs,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  notesWrap: {
    gap: spacing.sm,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  noteText: {
    ...typography.body.small,
    color: colors.text.primary,
    flex: 1,
  },
  buttonGroup: {
    gap: spacing.sm,
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
  },
  secondaryButtonText: {
    ...typography.button.large,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.error[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  deleteButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
