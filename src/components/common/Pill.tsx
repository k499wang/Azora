import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface PillProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
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
      <MaterialCommunityIcons name={"fire"} size={18} color={textColor} />
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
    borderRadius: 20,
    gap: spacing.sm,
  },
  label: {
    ...typography.label.large,
  },
});
