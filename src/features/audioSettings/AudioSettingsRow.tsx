import { Text } from '../../components/common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface AudioSettingsRowProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  previewable?: boolean;
  previewing?: boolean;
  onPreview?: () => void;
  premiumLocked?: boolean;
  disabled?: boolean;
}

export default function AudioSettingsRow({
  label,
  selected,
  onSelect,
  previewable = false,
  previewing = false,
  onPreview,
  premiumLocked = false,
  disabled = false,
}: AudioSettingsRowProps) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Pressable
        onPress={onSelect}
        disabled={disabled}
        style={styles.labelArea}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
      >
        <View style={[styles.bullet, selected && styles.bulletSelected]}>
          {selected ? <Icon name="check" size={12} color={colors.text.inverse} /> : null}
        </View>
        <Text
          style={[styles.label, selected && styles.labelSelected]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {premiumLocked ? <Text style={styles.proBadge}>PRO</Text> : null}
      </Pressable>

      {previewable && onPreview ? (
        <Pressable
          onPress={onPreview}
          hitSlop={spacing.sm}
          accessibilityRole="button"
          accessibilityLabel={previewing ? 'Stop preview' : 'Preview sound'}
          style={({ pressed }) => [styles.previewBtn, pressed && styles.previewBtnPressed]}
        >
          <Icon
            name={previewing ? 'close' : 'play-triangle'}
            size={14}
            color={colors.text.secondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  labelArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  bulletSelected: {
    backgroundColor: colors.primary.blue600,
    borderColor: colors.primary.blue600,
  },
  label: {
    ...typography.body.medium,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    flexShrink: 1,
  },
  labelSelected: {
    color: colors.primary.blue700,
  },
  proBadge: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    color: colors.orange[600],
    backgroundColor: colors.orange[100],
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  previewBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  previewBtnPressed: {
    opacity: 0.7,
  },
});
