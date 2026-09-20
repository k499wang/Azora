import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../../common/Text';
import { longFormStyles as styles } from './longFormStyles';

interface PaywallSectionProps {
  /** Plain text, or a fragment when one word of the heading is branded. */
  title: ReactNode;
  /**
   * Holds a heading to one line, shrinking it to fit rather than wrapping. Set
   * only where a two-line heading would push the section's own content down.
   */
  singleLineTitle?: boolean;
  children: ReactNode;
}

export function PaywallSection({
  title,
  singleLineTitle = false,
  children,
}: PaywallSectionProps) {
  return (
    <View style={styles.section}>
      <Text
        style={styles.title}
        numberOfLines={singleLineTitle ? 1 : undefined}
        adjustsFontSizeToFit={singleLineTitle || undefined}
        minimumFontScale={singleLineTitle ? 0.7 : undefined}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
