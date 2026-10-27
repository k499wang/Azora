import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
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
import ChunkyButton from '../../components/common/ChunkyButton';
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
import { fonts, typography } from '../../theme/typography';
import TaskCardBody, { taskCard } from '../../components/home/journey/TaskCardBody';
import RoutineTaskIcon from '../selfCare/RoutineTaskIcon';
import TaskTimer from '../selfCare/shared/TaskTimer';
import PlayerHeaderControls from '../selfCare/shared/PlayerHeaderControls';
import RearrangeSheet, { RearrangePill, type RearrangeItem } from '../selfCare/shared/RearrangeSheet';
import { speakRoutineLine, stopRoutineVoice } from '../selfCare/routineVoice';
import { ROUTINE_TIME_UP_LINE, routineStepAnnouncement } from '../selfCare/domain/routinePlayer';
import { useAudioPreferences } from '../audioSettings';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { useRoutineStepTimer } from '../selfCare/useRoutineStepTimer';
import { useTimerKeepAwake } from '../selfCare/shared/useTimerKeepAwake';
import { triggerActivityCompleteHaptic, triggerSoftHaptic } from '../../native/tapHaptics';
import { DEFAULT_ITEM_MINUTES, type CleanupItem, type CleanupPlan } from './domain/cleanupPlan';
import { PHOTO_CLEANUP_PREVIEW_PLAN } from './domain/cleanupPlanPreview';
import CleanupPlanOverview from './CleanupPlanOverview';
import CleanupItemSheet, { type CleanupItemEdit } from './CleanupItemSheet';
import { addItem, moveItem, removeItem, replaceItem } from './domain/cleanupPlanEdits';
import { cleanupItemIcon } from './domain/cleanupItemIcon';
import PhotoCleanupFreeBadge from './PhotoCleanupFreeBadge';
import AzoPortrait from '../mascot/AzoPortrait';
import PhotoCleanupCompletion from './PhotoCleanupCompletion';

type Stage = 'capture' | 'checkingAccess' | 'loading' | 'ready' | 'guide' | 'complete';

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
  const [stage, setStage] = useState<Stage>(preview ? 'ready' : 'capture');
  const [plan, setPlan] = useState<CleanupPlan | null>(preview ? PHOTO_CLEANUP_PREVIEW_PLAN : null);
  const [completedObjectCount, setCompletedObjectCount] = useState(0);
  const [rearranging, setRearranging] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState<number | null>(null);
  const [itemEdit, setItemEdit] = useState<CleanupItemEdit | null>(null);
  const access = useFeatureAccess(FeatureKey.PhotoCleanup);
  const {
    preferences: audioPreferences,
    loaded: voiceLoaded,
    setRoutineVoice,
    setRoutineAutoAdvance,
  } = useAudioPreferences();
  const voiceOn = audioPreferences.routineVoice;
  const autoAdvance = audioPreferences.routineAutoAdvance;
  const voiceOnRef = useRef(voiceOn);
  voiceOnRef.current = voiceOn;
  const speak = useCallback((line: string) => {
    if (voiceOnRef.current && navigation.isFocused() && AppState.currentState === 'active') {
      speakRoutineLine(line);
    }
  }, [navigation]);
  useWhileVisible(() => () => stopRoutineVoice(), []);
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
    setSlideKey(0);
    setStage('ready');
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
      setSlideKey(0);
      setStage('ready');
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
    setPhotoUri(result.uri);
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

  const endCleanup = useCallback(() => {
    setElapsedMinutes(startedAt == null ? null : Math.max(1, Math.round((Date.now() - startedAt) / 60_000)));
    setStage('complete');
  }, [startedAt]);

  const editItemAt = useCallback((index: number) => {
    if (plan == null) return;
    const item = plan.objects[index];
    if (item == null) return;
    setItemEdit({ item, index, canMoveUp: index > 0, canMoveDown: index < plan.objects.length - 1 });
  }, [plan]);

  const updateObjects = useCallback((change: (objects: CleanupItem[]) => CleanupItem[]) => {
    setPlan((current) => (current == null ? current : { ...current, objects: change(current.objects) }));
  }, []);

  const saveItemEdit = useCallback((item: CleanupItem) => {
    const index = itemEdit?.index ?? null;
    updateObjects((objects) => (index == null ? addItem(objects, item) : replaceItem(objects, index, item)));
    setItemEdit(null);
  }, [itemEdit, updateObjects]);

  const removeEditedItem = useCallback(() => {
    const index = itemEdit?.index ?? null;
    if (index != null) updateObjects((objects) => removeItem(objects, index));
    setItemEdit(null);
  }, [itemEdit, updateObjects]);

  const moveEditedItem = useCallback((direction: -1 | 1) => {
    if (plan == null || itemEdit?.index == null) return;
    const index = itemEdit.index;
    const target = index + direction;
    if (target < 0 || target >= plan.objects.length) return;
    updateObjects((objects) => moveItem(objects, index, direction));
    // The sheet follows the item to its new place, so it can keep moving.
    setItemEdit({ ...itemEdit, index: target, canMoveUp: target > 0, canMoveDown: target < plan.objects.length - 1 });
  }, [itemEdit, plan, updateObjects]);

  const startCleanup = useCallback(() => {
    if (plan == null || plan.objects.length === 0) return;
    setStartedAt(Date.now());
    setPaused(false);
    setStage('guide');
  }, [plan]);

  const finishActiveObject = useCallback(() => {
    if (plan == null || plan.objects.length === 0) return;
    triggerActivityCompleteHaptic();
    const remainingObjects = plan.objects.slice(1);
    setPlan({ ...plan, objects: remainingObjects });
    setCompletedObjectCount((count) => count + 1);

    if (remainingObjects.length === 0) {
      endCleanup();
      return;
    }

    setSlideKey((key) => key + 1);
  }, [endCleanup, plan]);

  const changeActiveMinutes = useCallback((change: number) => {
    if (plan == null) return;
    const [active, ...rest] = plan.objects;
    if (active == null) return;
    setPlan({ ...plan, objects: [{ ...active, minutes: Math.max(1, active.minutes + change) }, ...rest] });
  }, [plan]);

  const startAnotherSpot = useCallback(() => {
    setPhotoUri(null);
    setStartedAt(null);
    setElapsedMinutes(null);
    setPlan(null);
    setCompletedObjectCount(0);
    setSlideKey(0);
    setError(null);
    setStage('capture');
  }, []);

  const activeObject = plan?.objects[0] ?? null;
  const nextObject = plan?.objects[1] ?? null;
  const stepKey = activeObject == null ? 'none' : `${slideKey}:${activeObject.name}`;
  useEffect(() => setPaused(false), [stepKey]);
  const timer = useRoutineStepTimer({
    active: focused && stage === 'guide' && activeObject != null,
    paused,
    durationMs: activeObject == null ? null : activeObject.minutes * 60_000,
    stepKey,
    onElapsed: () => {
      if (autoAdvance) {
        finishActiveObject();
        return;
      }
      triggerSoftHaptic();
      speak(ROUTINE_TIME_UP_LINE);
    },
  });

  const announcement = stage !== 'guide' || activeObject == null
    ? null
    : routineStepAnnouncement({ title: activeObject.name }, activeObject.minutes, nextObject == null);
  const announcementRef = useRef(announcement);
  announcementRef.current = announcement;
  useEffect(() => {
    if (!voiceLoaded || announcementRef.current == null) return;
    speak(announcementRef.current);
  }, [stepKey, voiceLoaded, speak]);

  const moveRemaining = useCallback((offset: number, direction: -1 | 1) => {
    updateObjects((objects) => moveItem(objects, offset, direction));
    // The step on screen moving away starts the one now in its place.
    if (offset === 0 || offset + direction === 0) setSlideKey((key) => key + 1);
  }, [updateObjects]);
  useTimerKeepAwake('photo-cleanup', stage === 'guide' && !paused);
  return (
    <View style={[styles.screen, stage === 'complete' && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {stage !== 'complete' ? (
        <AppTopBar
          title={stage === 'guide' ? undefined : stage === 'ready' ? 'Your cleanup' : 'Help me clean this'}
          leftSlot={stage === 'guide' ? (
            <PlayerHeaderControls
              voiceOn={voiceOn}
              autoAdvance={autoAdvance}
              onToggleVoice={() => {
                if (voiceOn) stopRoutineVoice();
                setRoutineVoice(!voiceOn);
              }}
              onToggleAutoAdvance={() => setRoutineAutoAdvance(!autoAdvance)}
            />
          ) : undefined}
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

          {stage === 'ready' && plan != null ? (
            <CleanupPlanOverview
              photoUri={photoUri}
              items={plan.objects}
              safetyNote={plan.safetyNote}
              onEditItem={editItemAt}
              onAddItem={() => setItemEdit({
                item: { name: '', minutes: DEFAULT_ITEM_MINUTES },
                index: null,
                canMoveUp: false,
                canMoveDown: false,
              })}
            />
          ) : null}

          {stage === 'guide' && plan != null && activeObject != null ? (
            <View style={styles.guide}>
              <TaskTimer
                title={activeObject.name}
                icon={cleanupItemIcon(activeObject.name) as ComponentProps<typeof TaskTimer>['icon']}
                stepKey={stepKey}
                timer={timer}
                minutes={activeObject.minutes}
                paused={paused}
                onTogglePause={() => setPaused((current) => !current)}
                onLess={() => changeActiveMinutes(-1)}
                onMore={() => changeActiveMinutes(1)}
                onDone={finishActiveObject}
              />
              <View style={styles.nextBlock}>
                {plan.objects.length < 2 ? null : <RearrangePill onPress={() => setRearranging(true)} />}
                <View style={[taskCard.surface, taskCard.face]}>
                  <TaskCardBody icon={<RoutineTaskIcon name={nextObject == null ? 'celebration' : cleanupItemIcon(nextObject.name) as ComponentProps<typeof RoutineTaskIcon>['name']} />}>
                    <Text style={taskCard.overline}>{nextObject == null ? 'LAST ONE' : 'UP NEXT'}</Text>
                    <Text numberOfLines={1} style={taskCard.title}>
                      {nextObject == null ? 'Then you’re done' : nextObject.name}
                    </Text>
                    {nextObject == null ? null : <Text style={taskCard.detail}>About {nextObject.minutes} min</Text>}
                  </TaskCardBody>
                </View>
              </View>
              {plan.safetyNote == null ? null : <Text style={styles.safety}>{plan.safetyNote}</Text>}
            </View>
          ) : null}

          {stage === 'complete' && plan != null ? (
            <View style={styles.result}>
              <PhotoCleanupCompletion completedCount={completedObjectCount} elapsedMinutes={elapsedMinutes} active={focused} />
              <View style={styles.actions}>
                <ChunkyButton shape="card" label="Done" onPress={() => navigation.goBack()} />
                <ChunkyButton shape="card" label="Do another spot" tone={SECONDARY_TONE} onPress={startAnotherSpot} />
              </View>
            </View>
          ) : null}
        </ScreenContent>
      </ScrollView>
      {stage === 'ready' && plan != null ? (
        <ScreenContent width="grouped" style={[styles.slideshowFooter, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={styles.actions}>
            <ChunkyButton shape="card" label="Start cleaning" disabled={plan.objects.length === 0} onPress={startCleanup} icon={<Icon name="timer" size={22} color={colors.text.inverse} />} />
            <ChunkyButton shape="card" label="Use a different photo" tone={SECONDARY_TONE} onPress={startAnotherSpot} />
          </View>
        </ScreenContent>
      ) : null}
      <RearrangeSheet
        visible={rearranging && stage === 'guide' && (plan?.objects.length ?? 0) >= 2}
        onClose={() => setRearranging(false)}
        items={rearrangeItems(plan?.objects ?? [])}
        onMove={moveRemaining}
      />
      <CleanupItemSheet
        edit={itemEdit}
        onClose={() => setItemEdit(null)}
        onSave={saveItemEdit}
        onRemove={removeEditedItem}
        onMove={moveEditedItem}
      />
    </View>
  );
}

/** Plan items carry no id; a name and its count so far keep a key steady while it moves. */
function rearrangeItems(objects: readonly CleanupItem[]): RearrangeItem[] {
  const seen = new Map<string, number>();
  return objects.map((item) => {
    const count = seen.get(item.name) ?? 0;
    seen.set(item.name, count + 1);
    return {
      key: `${item.name}#${count}`,
      title: item.name,
      icon: cleanupItemIcon(item.name) as RearrangeItem['icon'],
      detail: `About ${item.minutes} min`,
    };
  });
}

const SECONDARY_TONE = { face: colors.background.card, lip: colors.border.default, label: colors.text.secondary };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flexGrow: 1, gap: spacing.lg, paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.xl, paddingBottom: spacing['5xl'] },
  slideshowContent: { paddingTop: 0, paddingBottom: spacing.md },
  nextBlock: { alignSelf: 'stretch', marginTop: 'auto', gap: spacing.sm },
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
  guide: { flex: 1, gap: spacing.lg, alignItems: 'center' },
  result: { flex: 1, gap: spacing.lg },
  safety: { ...typography.body.small, color: colors.error[700] },
});
