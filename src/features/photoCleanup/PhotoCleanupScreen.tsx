import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { PhotoCleanupScreenProps } from '../../app/navigation';
import AppTopBar from '../../components/common/AppTopBar';
import CloseButton from '../../components/common/CloseButton';
import ChunkyButton, { CHUNKY_TONE_DESTRUCTIVE } from '../../components/common/ChunkyButton';
import ScreenContent from '../../components/common/ScreenContent';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { getLifetimeFeatureUsageQueryKey } from '../../queries/subscriptions/useLifetimeFeatureUsageQuery';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { pauseSessionReplay } from '../../services/analytics/sessionReplay';
import { PhotoCleanupAccessError } from '../../services/photoCleanup/photoCleanupAccessError';
import { createPhotoCleanupPlan } from '../../services/photoCleanup/photoCleanupService';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey, type LifetimeFeatureUsage } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import CleanupStepStage from './CleanupStepStage';
import { useCleanupStepFinish } from './useCleanupStepFinish';
import { fonts, typography } from '../../theme/typography';
import { type CleanupPlan } from './domain/cleanupPlan';
import { PHOTO_CLEANUP_PREVIEW_PLAN } from './domain/cleanupPlanPreview';
import { getCleanupStepSubtitle } from './domain/cleanupStepSubtitle';
import { pickupInstruction } from './domain/pickupInstruction';
import { getCleanupMilestone } from './domain/cleanupMilestone';
import PhotoCleanupFreeBadge from './PhotoCleanupFreeBadge';
import AzoPortrait from '../mascot/AzoPortrait';
import PhotoCleanupCompletion from './PhotoCleanupCompletion';

type Stage = 'capture' | 'checkingAccess' | 'loading' | 'guide' | 'complete';

const FREE_RETRY_MESSAGE = 'That one didn’t count. Try again with more of the room in view.';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

/**
 * One owner for the sensitive image and its generated object order. The photo stays
 * in component memory only, and replay is paused for the complete flow so a
 * room image is never captured by analytics session replay.
 */
export default function PhotoCleanupScreen({ navigation, route }: PhotoCleanupScreenProps) {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const preview = __DEV__ && route.params?.preview === true;
  const [stage, setStage] = useState<Stage>(preview ? 'guide' : 'capture');
  const [plan, setPlan] = useState<CleanupPlan | null>(preview ? PHOTO_CLEANUP_PREVIEW_PLAN : null);
  const [completedObjectCount, setCompletedObjectCount] = useState(0);
  const [removedObjectCount, setRemovedObjectCount] = useState(0);
  const [totalObjectCount, setTotalObjectCount] = useState(preview ? PHOTO_CLEANUP_PREVIEW_PLAN.objects.length : 0);
  const [slideKey, setSlideKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const access = useFeatureAccess(FeatureKey.PhotoCleanup);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const queryClient = useQueryClient();

  useEffect(() => {
    navigation.setOptions({
      animation: stage === 'complete' ? 'fade' : 'slide_from_right',
      gestureEnabled: stage !== 'complete',
    });
  }, [navigation, stage]);

  useEffect(() => {
    if (!focused) return undefined;
    return pauseSessionReplay({ autoResumeAfterMs: null });
  }, [focused]);

  useEffect(() => {
    if (!preview) return;
    setPlan(PHOTO_CLEANUP_PREVIEW_PLAN);
    setCompletedObjectCount(0);
    setRemovedObjectCount(0);
    setTotalObjectCount(PHOTO_CLEANUP_PREVIEW_PLAN.objects.length);
    setSlideKey(0);
    setStage('guide');
  }, [preview]);

  const openPhotoCleanupPaywall = useCallback(() => {
    trackFeatureGateHit({
      feature: FeatureKey.PhotoCleanup,
      placement: PaywallPlacement.ProfileUpgrade,
      sourceScreen: 'PhotoCleanup',
      sourceAction: 'photo_selected',
      access,
    });
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.ProfileUpgrade,
      sourceScreen: 'PhotoCleanup',
      sourceAction: 'photo_selected',
      feature: FeatureKey.PhotoCleanup,
    });
  }, [access, navigation]);

  const markFreeCleanupUsed = useCallback(() => {
    if (access.isPro || userId == null) return;
    queryClient.setQueryData<LifetimeFeatureUsage>(
      getLifetimeFeatureUsageQueryKey(userId),
      { photoCleanupUsed: true },
    );
  }, [access.isPro, queryClient, userId]);

  const generatePlan = useCallback(async (imageBase64: string) => {
    setStage('loading');
    setError(null);
    try {
      const nextPlan = await createPhotoCleanupPlan({ imageBase64 });
      markFreeCleanupUsed();
      setPlan(nextPlan);
      setCompletedObjectCount(0);
      setRemovedObjectCount(0);
      setTotalObjectCount(nextPlan.objects.length);
      setSlideKey(0);
      setStage('guide');
    } catch (nextError) {
      setStage('capture');
      if (nextError instanceof PhotoCleanupAccessError) {
        markFreeCleanupUsed();
        openPhotoCleanupPaywall();
        return;
      }
      setError(access.reason === 'within_free_limit' ? FREE_RETRY_MESSAGE : errorMessage(nextError));
    }
  }, [access.reason, markFreeCleanupUsed, openPhotoCleanupPaywall]);

  const prepareAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1280 } }],
      {
        base64: true,
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    if (result.base64 == null) throw new Error('Could not prepare that photo.');
    await generatePlan(result.base64);
  }, [generatePlan]);

  const handleSelectedAsset = useCallback((asset: ImagePicker.ImagePickerAsset) => {
    // Let the user choose their real photo before checking Pro. The image stays
    // on-device unless access is allowed.
    if (access.isLoading) {
      setSelectedAsset(asset);
      setStage('checkingAccess');
      return;
    }

    if (!access.allowed) {
      openPhotoCleanupPaywall();
      return;
    }

    void prepareAsset(asset);
  }, [access.allowed, access.isLoading, openPhotoCleanupPaywall, prepareAsset]);

  useEffect(() => {
    if (stage !== 'checkingAccess' || selectedAsset == null || access.isLoading) return;

    setSelectedAsset(null);
    if (!access.allowed) {
      setStage('capture');
      openPhotoCleanupPaywall();
      return;
    }

    void prepareAsset(selectedAsset);
  }, [access.allowed, access.isLoading, openPhotoCleanupPaywall, prepareAsset, selectedAsset, stage]);

  const chooseFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access in Settings to choose a room photo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => { void Linking.openSettings(); } },
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0] != null) handleSelectedAsset(result.assets[0]);
  }, [handleSelectedAsset]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph the space you want help with.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => { void Linking.openSettings(); } },
      ]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.back,
    });
    if (!result.canceled && result.assets[0] != null) handleSelectedAsset(result.assets[0]);
  }, [handleSelectedAsset]);

  const finishActiveObject = useCallback(() => {
    if (plan == null || plan.objects.length === 0) return;
    const remainingObjects = plan.objects.slice(1);
    setPlan({ ...plan, objects: remainingObjects });
    setCompletedObjectCount((count) => count + 1);

    if (remainingObjects.length === 0) {
      setStage('complete');
      return;
    }

    setSlideKey((key) => key + 1);
  }, [plan]);

  const stepFinish = useCleanupStepFinish({
    active: focused && stage === 'guide',
    onFinished: finishActiveObject,
  });

  const skipActiveObject = useCallback(() => {
    if (plan == null) return;
    const activeObject = plan.objects[0];
    if (activeObject == null) return;

    setPlan({
      ...plan,
      objects: [
        ...plan.objects.slice(1),
        activeObject,
      ],
    });
    setSlideKey((key) => key + 1);
  }, [plan]);

  const removeActiveObject = useCallback(() => {
    if (plan == null || plan.objects.length === 0) return;
    const remainingObjects = plan.objects.slice(1);
    setPlan({ ...plan, objects: remainingObjects });
    setRemovedObjectCount((count) => count + 1);

    if (remainingObjects.length === 0) {
      setStage('complete');
      return;
    }

    setSlideKey((key) => key + 1);
  }, [plan]);

  const startAnotherSpot = useCallback(() => {
    setPlan(null);
    setCompletedObjectCount(0);
    setRemovedObjectCount(0);
    setTotalObjectCount(0);
    setSlideKey(0);
    setError(null);
    setStage('capture');
  }, []);

  const activeObject = plan?.objects[0] ?? null;
  const currentStep = completedObjectCount + removedObjectCount + 1;
  const milestone = getCleanupMilestone(completedObjectCount, totalObjectCount);
  return (
    <View style={[styles.screen, stage === 'complete' && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {stage !== 'complete' ? (
        <AppTopBar
          title={stage === 'guide' ? undefined : 'Help me clean this'}
          leftSlot={stage === 'guide' ? <Text style={styles.stepCount} accessibilityLiveRegion="polite">Step {currentStep} of {totalObjectCount}</Text> : undefined}
          rightSlot={<CloseButton accessibilityLabel="Close photo cleanup" onPress={() => navigation.goBack()} />}
          showAvatar={false}
          showStreak={false}
        />
      ) : null}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
        <ScreenContent width="grouped" style={[styles.content, stage === 'guide' && styles.slideshowContent]}>
          {stage === 'capture' ? (
            <>
              <View style={styles.azoStage}>
                <View style={styles.azoSpeechBubble}>
                  <View style={styles.azoSpeechTail} />
                  <Text style={styles.azoSpeechText}>Take a photo of the room, desk, or corner that feels like too much. I’ll tell you what to pick up first.</Text>
                </View>
                <AzoPortrait size={200} active={focused} />
              </View>
              {access.reason === 'within_free_limit' ? <PhotoCleanupFreeBadge style={styles.freeBadge} /> : null}
              {error == null ? null : <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
              <View style={styles.actions}>
                <ChunkyButton shape="card" label="Take a photo" onPress={() => { void takePhoto(); }} icon={<Icon name="camera" size={22} color={colors.text.inverse} />} />
                <ChunkyButton shape="card" label="Choose a photo" tone={SECONDARY_TONE} onPress={() => { void chooseFromLibrary(); }} icon={<Icon name="camera" size={22} color={colors.text.secondary} />} />
              </View>
            </>
          ) : null}

          {stage === 'loading' ? (
            <View style={styles.loading}><AzoPortrait size={144} holding="notes" active={focused} /><Text style={styles.loadingCopy}>Let’s find an easy place to start.</Text><ActivityIndicator size="small" color={colors.primary.blue500} /></View>
          ) : null}

          {stage === 'checkingAccess' ? (
            <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary.blue500} /><Text style={styles.title}>One moment…</Text></View>
          ) : null}

          {stage === 'guide' && plan != null && activeObject != null ? (
            <View style={styles.guide}>
              <CleanupStepStage
                instruction={pickupInstruction(activeObject)}
                subtitle={getCleanupStepSubtitle(currentStep, totalObjectCount)}
                milestone={milestone}
                slideKey={slideKey}
                active={focused}
                finishPhase={stepFinish.phase}
              />
              {plan.safetyNote == null ? null : <Text style={styles.safety}>{plan.safetyNote}</Text>}

            </View>
          ) : null}

          {stage === 'complete' && plan != null ? (
            <View style={styles.guide}>
              <PhotoCleanupCompletion completedCount={completedObjectCount} active={focused} />
              <View style={styles.actions}>
                <ChunkyButton shape="card" label="Do another spot" onPress={startAnotherSpot} />
                <ChunkyButton shape="card" label="Done" tone={SECONDARY_TONE} onPress={() => navigation.goBack()} />
              </View>
            </View>
          ) : null}
        </ScreenContent>
      </ScrollView>
      {stage === 'guide' && activeObject != null ? (
        <ScreenContent width="grouped" style={[styles.slideshowFooter, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={styles.guideActions}>
            <ChunkyButton shape="card" label={stepFinish.phase === 'idle' ? 'Finish' : 'Done!'} onPress={stepFinish.finish} disabled={stepFinish.phase !== 'idle'} minHeight={48} style={styles.guideAction} />
            <ChunkyButton shape="card" label="Skip" disabled={stepFinish.phase !== 'idle'} tone={SECONDARY_TONE} onPress={skipActiveObject} minHeight={48} style={styles.guideAction} />
            <ChunkyButton shape="card" label="Remove" disabled={stepFinish.phase !== 'idle'} tone={CHUNKY_TONE_DESTRUCTIVE} onPress={removeActiveObject} minHeight={48} style={styles.guideAction} />
          </View>
        </ScreenContent>
      ) : null}
    </View>
  );
}

const SECONDARY_TONE = { face: colors.background.card, lip: colors.border.default, label: colors.text.secondary };

const styles = StyleSheet.create({
  stepCount: { ...typography.title.title2, fontFamily: fonts.semibold, color: colors.text.primary },
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flexGrow: 1, gap: spacing.lg, paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.xl, paddingBottom: spacing['5xl'] },
  slideshowContent: { paddingTop: 0, paddingBottom: spacing.md },
  slideshowFooter: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.md },
  azoStage: { alignItems: 'center' },
  azoSpeechBubble: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 300,
    marginBottom: -spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + 3,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 3,
    borderColor: colors.border.subtle,
    borderBottomColor: colors.neutral[200],
    backgroundColor: colors.background.card,
  },
  azoSpeechTail: {
    position: 'absolute',
    zIndex: -1,
    bottom: -8,
    left: '50%',
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.card,
    transform: [{ rotate: '45deg' }],
  },
  azoSpeechText: { ...typography.body.large, fontFamily: fonts.semibold, textAlign: 'center', color: colors.text.primary },
  freeBadge: { alignSelf: 'center' },
  loadingCopy: { ...typography.body.large, textAlign: 'center', color: colors.text.primary },
  title: { ...typography.title.title1, fontFamily: fonts.semibold, color: colors.text.primary },
  actions: { gap: spacing.sm },
  error: { ...typography.body.small, color: colors.error[700] },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  guide: { flex: 1, gap: spacing.lg },
  safety: { ...typography.body.small, color: colors.error[700] },
  guideActions: { flexDirection: 'row', gap: spacing.sm },
  guideAction: { flex: 1 },
});
