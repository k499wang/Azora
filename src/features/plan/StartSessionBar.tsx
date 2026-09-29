import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import ChunkyButton, { CHUNKY_LIP_DEPTH } from '../../components/common/ChunkyButton';
import ScreenContent from '../../components/common/ScreenContent';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { duration } from '../../theme/motion';
import { padding, spacing } from '../../theme/spacing';

const BUTTON_HEIGHT = spacing['4xl'];

/** How much of the screen the bar covers above its `bottom`. */
export const START_SESSION_BAR_HEIGHT = BUTTON_HEIGHT + CHUNKY_LIP_DEPTH;

interface Props {
  visible: boolean;
  bottom: number;
  onPress: () => void;
}

/** Today's next exercise, one tap from the plan, while today is on screen. */
export default function StartSessionBar({ visible, bottom, onPress }: Props) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(duration.base)}
      exiting={FadeOutDown.duration(duration.fast)}
      style={[styles.float, { bottom }]}
    >
      <ScreenContent width="grouped" style={styles.column}>
        <ChunkyButton
          label="Start my plan"
          labelSize="xlarge"
          icon={<Icon name="play-triangle" size={22} color={colors.text.inverse} />}
          shape="card"
          minHeight={BUTTON_HEIGHT}
          onPress={onPress}
        />
      </ScreenContent>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  float: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  column: {
    paddingHorizontal: padding.screen.horizontal,
  },
});
