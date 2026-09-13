import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from './icons/Icon';
import { colors } from '../../theme/colors';

interface Props {
  children: ReactNode;
  size?: number;
  color?: string;
}

const DEFAULT_SIZE = 56;

export default function LaurelFrame({
  children,
  size = DEFAULT_SIZE,
  color = colors.accolade.laurel,
}: Props) {
  return (
    <View style={styles.row}>
      <Icon name="laurel" size={size} color={color} />
      <View style={styles.content}>{children}</View>
      <View style={styles.mirrored}>
        <Icon name="laurel" size={size} color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
});
