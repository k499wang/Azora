import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import StreakFlame from './StreakFlame';
import { Text } from './Text';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** the flame, sized to sit with the two lines of copy beside it */
const MARK_SIZE = 42;

interface CelebrationToastProps {
  title: string;
  detail?: string;
  visible: boolean;
}

/**
 * A dark bar over the page to confirm something landed.
 *
 * No entrance and no exit: it is kept mounted and simply shown or hidden, so
 * a tick costs a text swap rather than building views and an image on the
 * frame the confetti is launching on.
 */
function CelebrationToast({ title, detail, visible }: CelebrationToastProps) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.bar, !visible && styles.hidden]}
    >
      <StreakFlame size={MARK_SIZE} />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {detail == null ? null : (
          <Text style={styles.detail} numberOfLines={2}>
            {detail}
          </Text>
        )}
      </View>
    </View>
  );
}

export default memo(CelebrationToast);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.toast.fill,
  },
  hidden: {
    opacity: 0,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.toast.title,
  },
  detail: {
    ...typography.body.medium,
    fontFamily: fonts.regular,
    color: colors.toast.detail,
  },
});
