import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '../../components/common/BottomSheet';
import ChunkyButton, { CHUNKY_TONE_DESTRUCTIVE, CHUNKY_TONE_QUIET } from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import { Text, TextInput } from '../../components/common/Text';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { CleanupItem } from './domain/cleanupPlan';
import { clampItemMinutes, cleanItemName, MAX_EDITED_MINUTES } from './domain/cleanupPlanEdits';

/** The item being edited, or a blank one being added; null closes the sheet. */
export interface CleanupItemEdit {
  item: CleanupItem;
  /** null when adding */
  index: number | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

interface Props {
  edit: CleanupItemEdit | null;
  onClose: () => void;
  onSave: (item: CleanupItem) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

const STEPPER_ICON_SIZE = 20;

/**
 * How much of the sheet the keyboard covers. The sheet sizes to its content, so
 * the gap is added under the content and the sheet rises with the keyboard.
 */
function useKeyboardOverlap(): number {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => setHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return Math.max(0, height - insets.bottom);
}

export default function CleanupItemSheet({ edit, onClose, onSave, onRemove, onMove }: Props) {
  const lastEdit = useRef<CleanupItemEdit | null>(null);
  if (edit != null) lastEdit.current = edit;
  const shown = edit ?? lastEdit.current;
  const adding = shown?.index == null;

  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(2);
  // Loaded once each time the sheet opens; moving the item must not undo what was typed.
  const open = edit != null;
  useLayoutEffect(() => {
    const seed = lastEdit.current;
    if (!open || seed == null) return;
    setName(seed.item.name);
    setMinutes(seed.item.minutes);
  }, [open]);

  const keyboardOverlap = useKeyboardOverlap();
  const cleanName = cleanItemName(name);
  const save = () => {
    if (cleanName == null) return;
    onSave({ name: cleanName, minutes: clampItemMinutes(minutes) });
  };

  return (
    <BottomSheet visible={edit != null} onClose={onClose} title={adding ? 'Add something' : 'Edit item'}>
      <View style={styles.body}>
        <View style={[card.base, styles.nameCard]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Books on the floor"
            placeholderTextColor={colors.text.tertiary}
            autoFocus={adding}
            returnKeyType="done"
            onSubmitEditing={save}
            style={styles.nameInput}
            accessibilityLabel="What to pick up"
          />
        </View>

        <View style={[card.base, styles.row]}>
          <Text style={styles.rowLabel}>About how long?</Text>
          <View style={styles.stepper}>
            <StepperButton
              icon="minus"
              label="One minute less"
              disabled={minutes <= 1}
              onPress={() => setMinutes((current) => clampItemMinutes(current - 1))}
            />
            <Text style={styles.stepperValue}>{minutes} min</Text>
            <StepperButton
              icon="plus"
              label="One minute more"
              disabled={minutes >= MAX_EDITED_MINUTES}
              onPress={() => setMinutes((current) => clampItemMinutes(current + 1))}
            />
          </View>
        </View>

        {adding ? null : (
          <View style={styles.moves}>
            <ChunkyButton
              label="Move up"
              tone={CHUNKY_TONE_QUIET}
              disabled={!shown?.canMoveUp}
              onPress={() => onMove(-1)}
              icon={<Icon name="arrow-up" size={18} color={colors.primary.blue700} />}
              style={styles.move}
            />
            <ChunkyButton
              label="Move down"
              tone={CHUNKY_TONE_QUIET}
              disabled={!shown?.canMoveDown}
              onPress={() => onMove(1)}
              icon={<Icon name="arrow-down" size={18} color={colors.primary.blue700} />}
              style={styles.move}
            />
          </View>
        )}

        <ChunkyButton label={adding ? 'Add' : 'Save'} onPress={save} disabled={cleanName == null} />
        {adding ? null : <ChunkyButton label="Remove" tone={CHUNKY_TONE_DESTRUCTIVE} onPress={onRemove} />}
        {keyboardOverlap > 0 ? <View style={{ height: keyboardOverlap }} /> : null}
      </View>
    </BottomSheet>
  );
}

function StepperButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'minus' | 'plus';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={spacing.xs}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Icon name={icon} size={STEPPER_ICON_SIZE} color={colors.primary.blue700} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  nameCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  nameInput: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowLabel: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue100,
  },
  stepperValue: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    minWidth: 56,
    textAlign: 'center',
  },
  moves: { flexDirection: 'row', gap: spacing.sm },
  move: { flex: 1 },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
});
