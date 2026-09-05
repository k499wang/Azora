import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { card, radius } from '../../theme/card';
import OnboardingOptionIcon from './OnboardingOptionIcon';
import { colors } from '../../theme/colors';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Text } from '../common/Text';
import { MOOD_OPTIONS } from './data/moodOptions';
import type { OnboardingMood } from './types';

const FACE_SIZE = 44;
const ignoreRequestClose = () => {};

interface FirstResetMoodModalProps {
  visible: boolean;
  onSelect: (mood: OnboardingMood) => void;
}

export default function FirstResetMoodModal({
  visible,
  onSelect,
}: FirstResetMoodModalProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={ignoreRequestClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.title}>
            How do you feel?
          </Text>

          <View style={styles.row}>
            {MOOD_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={option.title}
                accessibilityHint="Selects this mood and continues onboarding"
                onPress={() => {
                  triggerTapHaptic();
                  onSelect(option.id);
                }}
                style={({ pressed }) => [
                  styles.face,
                  pressed && styles.facePressed,
                ]}
              >
                <OnboardingOptionIcon
                  name={option.icon}
                  size={FACE_SIZE}
                  color={option.accent}
                />
                <Text style={styles.label}>{option.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.overlay.dark,
  },
  dialog: {
    width: '100%',
    maxWidth: 344,
    borderRadius: radius.large,
    borderCurve: 'continuous',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    gap: spacing.sm,
    ...card.shadowModal,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  face: {
    ...card.base,
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  facePressed: pressable.control,
  label: {
    ...typography.label.medium,
    color: colors.neutral[900],
    textAlign: 'center',
  },
});
