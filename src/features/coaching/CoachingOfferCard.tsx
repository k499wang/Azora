import { StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import CoachingCard from './CoachingCard';
import { useCoachingOffer } from './useCoachingOffer';

interface CoachingOfferCardProps {
  userId: string | null;
}

/** Keeps its space until the X is pressed, then closes it so My Plan slides up. */
function CollapsingCoachingCard({ onDismissed }: { onDismissed: () => void }) {
  const measuredHeight = useSharedValue(0);
  const collapsing = useSharedValue(false);
  const open = useSharedValue(1);

  const style = useAnimatedStyle(() =>
    collapsing.value
      ? { height: measuredHeight.value * open.value, opacity: open.value }
      : {},
  );

  return (
    <Animated.View style={[styles.clip, style]}>
      <Animated.View
        onLayout={(event) => {
          measuredHeight.value = event.nativeEvent.layout.height;
        }}
        style={styles.content}
      >
        <CoachingCard
          surface="scrim"
          onDismiss={() => {
            collapsing.value = true;
            open.value = withTiming(
              0,
              { duration: duration.slow, easing: easing.settle },
              (finished) => {
                if (finished) runOnJS(onDismissed)();
              },
            );
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export default function CoachingOfferCard({ userId }: CoachingOfferCardProps) {
  const { visible, dismiss } = useCoachingOffer(userId);

  if (!visible) return null;

  return <CollapsingCoachingCard onDismissed={dismiss} />;
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  // Carries the space above My Plan, so that space closes with the card.
  content: {
    paddingBottom: spacing.md,
  },
});
