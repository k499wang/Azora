import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';

export interface FeatureInfoSection {
  heading: string;
  body: string;
}

interface FeatureInfoDialogProps {
  visible: boolean;
  title: string;
  intro?: string;
  sections?: FeatureInfoSection[];
  onClose: () => void;
}

export default function FeatureInfoDialog({
  visible,
  title,
  intro,
  sections = [],
  onClose,
}: FeatureInfoDialogProps) {
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
          <Text style={styles.title}>{title}</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {intro ? <Text style={styles.intro}>{intro}</Text> : null}
            {sections.map((section) => (
              <View key={section.heading} style={styles.section}>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Text style={styles.closeText}>Got it</Text>
          </Pressable>
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
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  intro: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeading: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  sectionBody: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  closeButton: {
    marginTop: spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary.blue600,
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeText: {
    ...typography.button.medium,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
});
