import { useMemo, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/icons/Icon';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import AudioSettingsRow from './AudioSettingsRow';
import LiveSignalToggleSection from './LiveSignalToggleSection';
import { audioCategories } from './registry';
import type { AudioCategory, AudioOption } from './types';
import { OFF_OPTION_ID } from './types';
import { useAudioPreferences } from './useAudioPreferences';
import { useAudioPreview } from './useAudioPreview';
import { useShowLiveSignalPreference } from '../../hooks/useShowLiveSignalPreference';

interface AudioSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  extraSectionsTop?: ReactNode;
}

export default function AudioSettingsSheet({
  visible,
  onClose,
  title = 'Settings',
  extraSectionsTop,
}: AudioSettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const { preferences, select, reset } = useAudioPreferences();
  const { play, stop, previewingAsset } = useAudioPreview();
  const { showLiveSignalEnabled, setShowLiveSignalEnabled } = useShowLiveSignalPreference();

  const handleClose = () => {
    stop();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropDismiss} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close audio settings"
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Icon name="close" size={18} color={colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {extraSectionsTop}
            <LiveSignalToggleSection
              enabled={showLiveSignalEnabled}
              onToggle={setShowLiveSignalEnabled}
            />
            {audioCategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                selectedId={preferences[category.id]}
                onSelect={(optionId) => select(category.id, optionId)}
                previewingAsset={previewingAsset}
                onPreview={(asset) => {
                  if (previewingAsset === asset) {
                    stop();
                  } else {
                    play(asset);
                  }
                }}
              />
            ))}

            <Pressable
              onPress={reset}
              accessibilityRole="button"
              style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
            >
              <Text style={styles.resetLabel}>Reset to defaults</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface CategorySectionProps {
  category: AudioCategory;
  selectedId: string | null;
  onSelect: (optionId: string | null) => void;
  previewingAsset: number | null;
  onPreview: (asset: number) => void;
}

function CategorySection({
  category,
  selectedId,
  onSelect,
  previewingAsset,
  onPreview,
}: CategorySectionProps) {
  const rows = useMemo<Array<AudioOption | { kind: 'off' }>>(() => {
    const list: Array<AudioOption | { kind: 'off' }> = [];
    if (category.allowOff) list.push({ kind: 'off' });
    list.push(...category.options);
    return list;
  }, [category]);

  const empty = category.options.length === 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{category.title}</Text>
      <Text style={styles.sectionDescription}>{category.description}</Text>

      <View style={styles.sectionList}>
        {rows.map((row) => {
          if ('kind' in row) {
            return (
              <AudioSettingsRow
                key={`${category.id}-off`}
                label="Off"
                selected={selectedId == null}
                onSelect={() => onSelect(null)}
              />
            );
          }
          const previewing = row.asset != null && previewingAsset === row.asset;
          return (
            <AudioSettingsRow
              key={`${category.id}-${row.id}`}
              label={row.label}
              selected={selectedId === row.id}
              onSelect={() => onSelect(row.id)}
              previewable={category.previewable && row.asset != null}
              previewing={previewing}
              onPreview={
                row.asset != null ? () => onPreview(row.asset as number) : undefined
              }
              premiumLocked={row.premium}
            />
          );
        })}

        {empty ? (
          <Text style={styles.emptyHint}>
            No options yet.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    ...card.base,
    ...card.shadow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  closeBtn: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: spacing.xl / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  pressed: {
    opacity: 0.7,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  sectionDescription: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing.sm + 2,
  },
  sectionList: {
    gap: spacing.xs + 2,
  },
  emptyHint: {
    ...typography.body.small,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  resetBtn: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resetLabel: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
});
