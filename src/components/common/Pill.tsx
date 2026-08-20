import { Text } from './Text';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Icon, { type IconName } from './icons/Icon';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface PillProps {
  icon: IconName;
  label: string;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export default function Pill({
  icon,
  label,
  backgroundColor = colors.orange[400],
  textColor = colors.text.inverse,
  style,
}: PillProps) {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Icon name={icon} size={18} color={textColor} />
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.large,
    gap: spacing.sm,
  },
  label: {
    ...typography.label.large,
  },
});