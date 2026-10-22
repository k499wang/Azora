import type { ReactNode } from 'react';
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from '../../common/Text';
import { longFormStyles as styles } from './longFormStyles';

interface PaywallSectionProps {
  /** Plain text, or a fragment when one word of the heading is branded. Omit for no heading. */
  title?: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  /**
   * Holds a heading to one line, shrinking it to fit rather than wrapping. Set
   * only where a two-line heading would push the section's own content down.
   */
  singleLineTitle?: boolean;
  children: ReactNode;
}

export function PaywallSection({
  title,
  titleStyle,
  style,
  singleLineTitle = false,
  children,
}: PaywallSectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title != null ? (
        <Text
          style={[styles.title, titleStyle]}
          numberOfLines={singleLineTitle ? 1 : undefined}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
