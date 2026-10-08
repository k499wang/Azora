import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const CLIP_WIDTH = 56;
const CLIP_HEIGHT = 16;

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A lipped white card held by a clip at its top edge, read as a filed record. */
export default function ClipboardCard({ children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.clip} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.lipped,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clip: {
    position: 'absolute',
    top: -CLIP_HEIGHT / 2,
    alignSelf: 'center',
    width: CLIP_WIDTH,
    height: CLIP_HEIGHT,
    borderRadius: radius.xs,
    borderCurve: 'continuous',
    backgroundColor: colors.primary.blue500,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary.blue700,
  },
});
