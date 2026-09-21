import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';
import SlideUpSheet from '../common/SlideUpSheet';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { getHouseCleaningPdfUri, shareHouseCleaningPdf } from '../../services/routineLibrary/houseCleaningPdf';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface HouseCleaningPdfPreviewSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Full native PDF reader presented directly over the Explore library. */
export default function HouseCleaningPdfPreviewSheet({
  visible,
  onClose,
}: HouseCleaningPdfPreviewSheetProps) {
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setError(null);
    void getHouseCleaningPdfUri()
      .then((nextUri) => {
        if (active) setUri(nextUri);
      })
      .catch(() => {
        if (active) setError('Could not load this PDF.');
      });
    return () => {
      active = false;
    };
  }, [visible]);

  return (
    <SlideUpSheet visible={visible} onClose={onClose} fullHeight>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>House cleaning checklist</Text>
          <Text style={styles.metadata}>PDF · 10 pages</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close PDF preview"
          hitSlop={spacing.sm}
          onPress={onClose}
          style={styles.close}
        >
          <Icon name="close" size={20} color={colors.text.primary} />
        </Pressable>
      </View>
      <View style={styles.viewer}>
        {uri != null ? (
          <Pdf
            source={{ uri }}
            style={styles.pdf}
            onError={() => setError('Could not load this PDF.')}
          />
        ) : null}
        {error != null ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share or save PDF"
        onPress={() => void shareHouseCleaningPdf().catch(() => setError('Could not share this PDF.'))}
        style={styles.share}
      >
        <Text style={styles.shareLabel}>Share or save PDF</Text>
      </Pressable>
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  titleBlock: { flex: 1, gap: 2 },
  title: { ...typography.title.title3, fontFamily: fonts.semibold, color: colors.text.primary },
  metadata: { ...typography.label.medium, color: colors.text.tertiary },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[100] },
  viewer: { flex: 1, marginHorizontal: spacing.lg, backgroundColor: colors.neutral[100], overflow: 'hidden' },
  pdf: { flex: 1, width: '100%', backgroundColor: colors.neutral[100] },
  error: { ...typography.body.medium, color: colors.error[700], padding: spacing.lg, textAlign: 'center' },
  share: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, minHeight: 44, marginHorizontal: spacing.lg, marginTop: spacing.md },
  shareLabel: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.brand },
});
