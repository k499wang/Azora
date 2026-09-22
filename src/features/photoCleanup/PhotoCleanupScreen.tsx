import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import type { PhotoCleanupScreenProps } from '../../app/navigation';
import AppTopBar from '../../components/common/AppTopBar';
import ChunkyButton from '../../components/common/ChunkyButton';
import Confetti from '../../components/common/Confetti';
import ScreenContent from '../../components/common/ScreenContent';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { pauseSessionReplay } from '../../services/analytics/sessionReplay';
import { createPhotoCleanupPlan } from '../../services/photoCleanup/photoCleanupService';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { type CleanupPlan } from './domain/cleanupPlan';
import { PHOTO_CLEANUP_PREVIEW_PLAN } from './domain/cleanupPlanPreview';
import AzoPortrait from '../mascot/AzoPortrait';

type Stage = 'capture' | 'checkingAccess' | 'loading' | 'guide' | 'complete';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

function pickupInstruction(object: string): string {
  return `Pick up ${object.charAt(0).toLowerCase()}${object.slice(1)}.`;
}

/**
 * One owner for the sensitive image and its generated object order. The photo stays
 * in component memory only, and replay is paused for the complete flow so a
 * room image is never captured by analytics session replay.
 */
export default function PhotoCleanupScreen({ navigation, route }: PhotoCleanupScreenProps) {
  const focused = useIsFocused();
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

  const generatePlan = useCallback(async (imageBase64: string) => {
    setStage('loading');
    setError(null);
    try {
      const nextPlan = await createPhotoCleanupPlan({ imageBase64 });
      setPlan(nextPlan);
      setCompletedObjectCount(0);
      setRemovedObjectCount(0);
      setTotalObjectCount(nextPlan.objects.length);
      setSlideKey(0);
      setStage('guide');
    } catch (nextError) {
      setError(errorMessage(nextError));
      setStage('capture');
    }
  }, []);

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

  const activeObject = plan?.objects[0] ?? null;

  return (
    <View style={styles.screen}>
      <AppTopBar title="Help me clean this" showBack showAvatar={false} showStreak={false} />
      <ScreenContent width="grouped" style={styles.content}>
        {stage === 'capture' ? (
          <>
            <View style={styles.azoStage}>
              <View style={styles.azoSpeechBubble}>
                <View style={styles.azoSpeechTail} />
                <Text style={styles.azoSpeechText}>Take a photo of the room, desk, or corner that feels like too much. I’ll tell you what to pick up first.</Text>
              </View>
              <AzoPortrait size={144} active={false} />
            </View>
            <View style={styles.actions}>
              <ChunkyButton shape="card" label="Take a photo" onPress={() => { void takePhoto(); }} icon={<Icon name="camera" size={22} color={colors.text.inverse} />} />
              <ChunkyButton shape="card" label="Choose a photo" tone={SECONDARY_TONE} onPress={() => { void chooseFromLibrary(); }} icon={<Icon name="camera" size={22} color={colors.text.secondary} />} />
            </View>
            {error == null ? null : <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          </>
        ) : null}

        {stage === 'loading' ? (
          <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary.blue500} /><Text style={styles.title}>Putting things in order…</Text></View>
        ) : null}

        {stage === 'checkingAccess' ? (
          <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary.blue500} /><Text style={styles.title}>One moment…</Text></View>
        ) : null}

        {stage === 'guide' && plan != null && activeObject != null ? (
          <View style={styles.guide}>
            <Animated.View key={slideKey} entering={FadeInRight.duration(220)} style={styles.stepCard}>
              <Text style={styles.progress}>Step {completedObjectCount + removedObjectCount + 1} of {totalObjectCount}</Text>
              <Text style={styles.stepObject}>{pickupInstruction(activeObject)}</Text>
              <Text style={styles.stepHelp}>Put it away, in the hamper, or in a trash bag—whatever is easiest.</Text>
            </Animated.View>
            {plan.safetyNote == null ? null : <Text style={styles.safety}>{plan.safetyNote}</Text>}
            <View style={styles.guideActions}>
              <ChunkyButton shape="card" label="Finish" onPress={finishActiveObject} minHeight={48} icon={<Icon name="check" size={18} color={colors.text.inverse} />} style={styles.guideAction} />
              <ChunkyButton shape="card" label="Skip" tone={SECONDARY_TONE} onPress={skipActiveObject} minHeight={48} style={styles.guideAction} />
              <ChunkyButton shape="card" label="Remove" tone={REMOVE_TONE} onPress={removeActiveObject} minHeight={48} style={styles.guideAction} />
            </View>
          </View>
        ) : null}

        {stage === 'complete' && plan != null ? (
          <View style={styles.guide}>
            <Animated.View entering={FadeInRight.duration(220)} style={styles.stepCard}>
              <Icon name="check" size={42} color={colors.success[700]} />
              <Text style={styles.completeTitle}>Finished!</Text>
              <Text style={styles.completeBody}>You finished {completedObjectCount} {completedObjectCount === 1 ? 'thing' : 'things'}. That’s a real win.</Text>
              {removedObjectCount === 0 ? <Text style={styles.completeDetail}>Everything on your list is done.</Text> : null}
            </Animated.View>
            <ChunkyButton shape="card" label="Back to Azo’s toolkit" onPress={() => navigation.goBack()} />
          </View>
        ) : null}
      </ScreenContent>
      {stage === 'complete' ? <Confetti pieceColors={[colors.primary.blue400, colors.orange[400]]} origin="fall" pieceCount={28} active /> : null}
    </View>
  );
}

const SECONDARY_TONE = { face: colors.background.card, lip: colors.border.default, label: colors.text.secondary };
const REMOVE_TONE = { face: colors.error[100], lip: colors.error[300], label: colors.error[700] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.xl, paddingBottom: spacing['5xl'] },
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
  title: { ...typography.title.title1, fontFamily: fonts.semibold, color: colors.text.primary },
  body: { ...typography.body.large, color: colors.text.secondary },
  actions: { gap: spacing.sm },
  error: { ...typography.body.small, color: colors.error[700] },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  guide: { flex: 1, gap: spacing.lg },
  progress: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.primary.blue700 },
  stepCard: { ...card.base, ...card.shadow, flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, borderRadius: radius.large },
  stepObject: { ...typography.title.title1, fontFamily: fonts.semibold, textAlign: 'center', color: colors.text.primary },
  stepHelp: { ...typography.body.small, textAlign: 'center', color: colors.text.secondary },
  safety: { ...typography.body.small, color: colors.error[700] },
  guideActions: { flexDirection: 'row', gap: spacing.sm },
  guideAction: { flex: 1 },
  completeTitle: { ...typography.title.title1, fontFamily: fonts.semibold, color: colors.text.primary },
  completeBody: { ...typography.body.large, textAlign: 'center', color: colors.text.secondary },
  completeDetail: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.success[700] },
});
