import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

export type OnboardingOptionIconName = NonNullable<
  ComponentProps<typeof MaterialCommunityIcons>['name']
>;

interface OnboardingOptionIconProps {
  name: OnboardingOptionIconName;
  size?: number;
  selected?: boolean;
  color?: string;
}

export default function OnboardingOptionIcon({
  name,
  size = 22,
  selected = false,
  color,
}: OnboardingOptionIconProps) {
  return (
    <View style={styles.slot}>
      <MaterialCommunityIcons
        name={name}
        size={size}
        color={color ?? (selected ? colors.primary.blue600 : colors.accent[600])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
