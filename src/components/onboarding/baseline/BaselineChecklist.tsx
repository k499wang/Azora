import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

export type BaselineReadingTip = {
  id: string;
  title: string;
  detail: string;
};

interface BaselineChecklistProps {
  tips: BaselineReadingTip[];
  checkedTipIds: Set<string>;
  onToggleTip: (id: string) => void;
}

export function BaselineChecklist({
  tips,
  checkedTipIds,
  onToggleTip,
}: BaselineChecklistProps) {
  return (
    <View style={styles.checklistSection}>
      <Text style={styles.checklistTitle}>Before you start</Text>
      <Text style={styles.checklistSubtitle}>
        Tap each one as you’re set up.
      </Text>
      <View style={styles.tipsList}>
        {tips.map((tip, index) => {
          const checked = checkedTipIds.has(tip.id);
          return (
            <Pressable
              key={tip.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={tip.title}
              onPress={() => onToggleTip(tip.id)}
              style={({ pressed }) => [
                styles.tipRow,
                pressed && styles.tipRowPressed,
              ]}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked ? (
                  <Icon name="check" size={14} color={colors.text.inverse} />
                ) : null}
              </View>
              <View style={styles.tipText}>
                <Text style={[styles.tipTitle, checked && styles.tipTitleChecked]}>
                  {tip.title}
                </Text>
                <Text style={styles.tipDetail}>{tip.detail}</Text>
              </View>
              {index < tips.length - 1 && <View style={styles.tipDivider} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default BaselineChecklist;

const styles = StyleSheet.create({
  checklistSection: {
    gap: spacing.xs,
  },
  checklistTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 22,
    color: colors.text.primary,
  },
  checklistSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  tipsList: {
    marginTop: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  tipRowPressed: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.blue600,
    borderColor: colors.primary.blue600,
  },
  tipText: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    letterSpacing: -0.1,
  },
  tipTitleChecked: {
    color: colors.text.secondary,
  },
  tipDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  tipDivider: {
    position: 'absolute',
    bottom: 0,
    left: 24 + spacing.md,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
});
