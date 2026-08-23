import { Text } from '../../components/common/Text';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '../../components/common/BottomSheet';
import type { RootStackNavigationProp } from '../../app/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import AudioSettingsRow from './AudioSettingsRow';
import HeartRateMonitoringSection from './HeartRateMonitoringSection';
import { audioCategories } from './registry';
import type { AudioCategory, AudioOption } from './types';
import { useAudioPreferences } from './useAudioPreferences';
import { useAudioPreview } from './useAudioPreview';
import { useHeartRateMonitoringPreference } from '../../hooks/useHeartRateMonitoringPreference';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';

interface AudioSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  extraSectionsTop?: ReactNode;
  heartRateMonitoringLocked?: boolean;
}

export default function AudioSettingsSheet({
  visible,
  onClose,
  title = 'Settings',
  extraSectionsTop,
  heartRateMonitoringLocked = false,
}: AudioSettingsSheetProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { preferences, select, reset } = useAudioPreferences();
  const { play, stop, previewingAsset } = useAudioPreview();
  const heartRatePaywallPendingRef = useRef(false);
  const heartRateMonitoringAccess = useFeatureAccess(FeatureKey.BreathingHeartRateMonitoring);
  const {
    heartRateMonitoringEnabled,
    setHeartRateMonitoringEnabled,
  } = useHeartRateMonitoringPreference();
  const heartRateMonitoringProLocked =
    !heartRateMonitoringAccess.allowed && !heartRateMonitoringAccess.isLoading;
  const effectiveHeartRateMonitoringEnabled =
    heartRateMonitoringProLocked ? false : heartRateMonitoringEnabled;

  useEffect(() => {
    if (!heartRateMonitoringProLocked || !heartRateMonitoringEnabled) return;
    setHeartRateMonitoringEnabled(false);
  }, [
    heartRateMonitoringEnabled,
    heartRateMonitoringProLocked,
    setHeartRateMonitoringEnabled,
  ]);

  const navigateToHeartRateMonitoringPaywall = useCallback(() => {
    if (!heartRatePaywallPendingRef.current) return;
    heartRatePaywallPendingRef.current = false;
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.HeartRateProGate,
      sourceScreen: 'AudioSettings',
      sourceAction: 'heart_rate_monitoring_toggle',
      feature: FeatureKey.BreathingHeartRateMonitoring,
    });
  }, [navigation]);

  const openHeartRateMonitoringPaywall = useCallback(() => {
    if (heartRatePaywallPendingRef.current) return;

    trackFeatureGateHit({
      feature: FeatureKey.BreathingHeartRateMonitoring,
      placement: PaywallPlacement.HeartRateProGate,
      sourceScreen: 'AudioSettings',
      sourceAction: 'heart_rate_monitoring_toggle',
      access: heartRateMonitoringAccess,
    });
    heartRatePaywallPendingRef.current = true;
    stop();
    onClose();
  }, [heartRateMonitoringAccess, onClose, stop]);

  const handleHeartRateMonitoringToggle = useCallback(
    (enabled: boolean) => {
      if (enabled && heartRateMonitoringProLocked) {
        openHeartRateMonitoringPaywall();
        return;
      }
      setHeartRateMonitoringEnabled(enabled);
    },
    [
      heartRateMonitoringProLocked,
      openHeartRateMonitoringPaywall,
      setHeartRateMonitoringEnabled,
    ],
  );

  const handleClose = () => {
    stop();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={title}
      onDismissed={navigateToHeartRateMonitoringPaywall}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {extraSectionsTop}
        <HeartRateMonitoringSection
          enabled={effectiveHeartRateMonitoringEnabled}
          locked={heartRateMonitoringLocked}
          proLocked={heartRateMonitoringProLocked}
          onToggle={handleHeartRateMonitoringToggle}
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
    </BottomSheet>
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
