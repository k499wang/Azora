import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { card, radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';

interface CenterDialogProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function CenterDialog({ visible, onClose, children }: CenterDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          {children}
        </Pressable>
      </Pressable>
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
    maxWidth: 360,
    maxHeight: '80%',
    borderRadius: radius.large,
    borderCurve: 'continuous',
    backgroundColor: colors.background.elevated,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    ...card.shadowModal,
  },
});
