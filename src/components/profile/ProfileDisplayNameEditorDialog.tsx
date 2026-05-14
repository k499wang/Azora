import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';

interface ProfileDisplayNameEditorDialogProps {
  visible: boolean;
  displayName: string;
  isSaving?: boolean;
  onCancel: () => void;
  onSave: (displayName: string) => Promise<void> | void;
}

export default function ProfileDisplayNameEditorDialog({
  visible,
  displayName,
  isSaving = false,
  onCancel,
  onSave,
}: ProfileDisplayNameEditorDialogProps) {
  const [draftName, setDraftName] = useState(displayName);

  useEffect(() => {
    if (visible) {
      setDraftName(displayName);
    }
  }, [displayName, visible]);

  const handleCancel = () => {
    if (!isSaving) {
      onCancel();
    }
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    try {
      await onSave(draftName);
    } catch {
      // The screen owns user-facing error copy. Keep the dialog open for correction.
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.dialog}>
          <Text style={styles.title}>Edit name</Text>
          <TextInput
            accessibilityLabel="Display name"
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            editable={!isSaving}
            maxLength={40}
            onChangeText={setDraftName}
            onSubmitEditing={() => {
              void handleSave();
            }}
            placeholder="Display name"
            placeholderTextColor={colors.text.tertiary}
            returnKeyType="done"
            style={styles.input}
            value={draftName}
          />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={handleCancel}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && !isSaving && styles.actionButtonPressed,
                isSaving && styles.actionButtonDisabled,
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => {
                void handleSave();
              }}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && !isSaving && styles.actionButtonPressed,
                isSaving && styles.actionButtonDisabled,
              ]}
            >
              <Text style={styles.saveText}>{isSaving ? 'Saving' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.overlay.dark,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  title: {
    ...typography.heading.heading1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.md,
    ...typography.input.text,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  actionButton: {
    minWidth: 72,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
  },
  actionButtonPressed: {
    backgroundColor: colors.overlay.light,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    ...typography.button.medium,
    color: colors.text.secondary,
  },
  saveText: {
    ...typography.button.medium,
    color: colors.primary.blue700,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
});
