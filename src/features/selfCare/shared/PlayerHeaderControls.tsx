import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '../../../components/common/icons/Icon';
import { triggerTapHaptic } from '../../../native/tapHaptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

export const PLAYER_HEADER_BUTTON_SIZE = 40;
export const PLAYER_HEADER_ICON_SIZE = 18;

interface Props {
  voiceOn: boolean;
  autoAdvance: boolean;
  onToggleVoice: () => void;
  onToggleAutoAdvance: () => void;
}

/** The voice guide and auto-advance switches a timed step player carries in its header. */
export default function PlayerHeaderControls({ voiceOn, autoAdvance, onToggleVoice, onToggleAutoAdvance }: Props) {
  return (
    <View style={styles.group}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={voiceOn ? 'Voice guide on' : 'Voice guide off'}
        hitSlop={spacing.sm}
        onPress={() => {
          triggerTapHaptic();
          onToggleVoice();
        }}
        style={({ pressed }) => [playerHeaderButton.button, pressed && playerHeaderButton.pressed]}
      >
        <Icon
          name={voiceOn ? 'volume-high' : 'volume-off'}
          size={PLAYER_HEADER_ICON_SIZE}
          color={colors.text.secondary}
        />
      </Pressable>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel="Start the next step when time is up"
        accessibilityState={{ checked: autoAdvance }}
        hitSlop={spacing.sm}
        onPress={() => {
          triggerTapHaptic();
          onToggleAutoAdvance();
        }}
        style={({ pressed }) => [
          playerHeaderButton.button,
          autoAdvance && styles.on,
          pressed && playerHeaderButton.pressed,
        ]}
      >
        <Icon
          name="auto-advance"
          size={PLAYER_HEADER_ICON_SIZE}
          color={autoAdvance ? colors.text.brand : colors.text.secondary}
        />
      </Pressable>
    </View>
  );
}

/** The round header button, for the player's own close control beside these. */
export const playerHeaderButton = StyleSheet.create({
  button: {
    width: PLAYER_HEADER_BUTTON_SIZE,
    height: PLAYER_HEADER_BUTTON_SIZE,
    borderRadius: PLAYER_HEADER_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  pressed: {
    opacity: 0.6,
  },
});

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  on: {
    backgroundColor: colors.primary.blue100,
  },
});
