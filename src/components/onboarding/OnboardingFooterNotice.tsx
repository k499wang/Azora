import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { card } from '../../theme/card';
import { duration } from '../../theme/motion';
import { spacing } from '../../theme/spacing';

interface OnboardingFooterNoticeProps {
  children: ReactNode;
}

/** A card that floats just above the footer button; render it inside the footer. */
export default function OnboardingFooterNotice({ children }: OnboardingFooterNoticeProps) {
  return (
    <Reanimated.View
      entering={FadeIn.duration(duration.base)}
      exiting={FadeOut.duration(duration.fast)}
      pointerEvents="none"
      style={styles.notice}
    >
      {children}
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...card.base,
    ...card.shadow,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
});
