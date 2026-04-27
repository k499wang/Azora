import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

interface ProfileAccountCardProps {
  email?: string;
  onOpenNotifications?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTerms?: () => void;
  onExportData?: () => void;
  onSignOut?: () => void;
  onManageSubscription?: () => void;
  onDeleteAccount?: () => void;
}

interface RowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  detail?: string;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}

function Row({ icon, label, detail, onPress, destructive, isLast }: RowProps) {
  const tint = destructive ? colors.error[500] : colors.primary.blue600;
  const labelColor = destructive ? colors.error[500] : colors.text.primary;
  const disabled = onPress == null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={tint} />
      <Text style={[styles.rowLabel, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {detail ? (
        <Text style={styles.rowDetail} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
      {!destructive ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.text.tertiary}
        />
      ) : null}
    </Pressable>
  );
}

export default function ProfileAccountCard({
  email,
  onOpenNotifications,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onExportData,
  onSignOut,
  onManageSubscription,
  onDeleteAccount,
}: ProfileAccountCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Account & privacy</Text>
      </View>

      <View style={styles.rowGroup}>
        {email ? (
          <Row icon="email-outline" label="Email" detail={email} />
        ) : null}
        <Row
          icon="bell-outline"
          label="Notifications"
          onPress={onOpenNotifications}
        />
        <Row
          icon="shield-lock-outline"
          label="Privacy policy"
          onPress={onOpenPrivacyPolicy}
        />
        <Row
          icon="file-document-outline"
          label="Terms of service"
          onPress={onOpenTerms}
        />
        <Row
          icon="download-outline"
          label="Export my data"
          onPress={onExportData}
        />
        <Row
          icon="logout-variant"
          label="Sign out"
          onPress={onSignOut}
          destructive
          isLast
        />
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
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  rowGroup: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowLabel: {
    ...typography.body.medium,
    fontFamily: fonts.medium,
    fontWeight: '500',
    flex: 1,
  },
  rowDetail: {
    ...typography.body.small,
    color: colors.text.tertiary,
    maxWidth: '50%',
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
