import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

interface ProfileAccountCardProps {
  onOpenNotifications?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTerms?: () => void;
  onSignOut?: () => void;
  onManageSubscription?: () => void;
  onDeleteAccount?: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: (enabled: boolean) => void;
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
  hapticsEnabled,
  onOpenNotifications,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onSignOut,
  onManageSubscription,
  onDeleteAccount,
  onToggleHaptics,
}: ProfileAccountCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.rowGroup}>
        <Row
          icon="bell-outline"
          label="Notifications"
          onPress={onOpenNotifications}
        />
        <View style={[styles.row, styles.rowDivider]}>
          <MaterialCommunityIcons
            name="vibrate"
            size={20}
            color={colors.primary.blue600}
          />
          <Text style={[styles.rowLabel, styles.hapticsLabel]} numberOfLines={1}>
            Haptics
          </Text>
          <Switch
            value={hapticsEnabled}
            onValueChange={onToggleHaptics}
            trackColor={{
              false: colors.neutral[300],
              true: colors.primary.blue300,
            }}
            thumbColor={hapticsEnabled ? colors.primary.blue600 : colors.neutral[50]}
          />
        </View>
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
  hapticsLabel: {
    color: colors.text.primary,
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
