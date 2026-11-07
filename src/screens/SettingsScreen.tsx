import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';
import * as Device from 'expo-device';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import Animated from 'react-native-reanimated';
import CollapsingTitleBar, { CollapsingBackTitle, useCollapsingTitle } from '../components/common/CollapsingTitleBar';
import SectionHeader from '../components/common/SectionHeader';
import SettingsGroup from '../components/settings/SettingsGroup';
import SettingsRow from '../components/settings/SettingsRow';
import NotificationsSettingsSheet from '../features/notifications/NotificationsSettingsSheet';
import { useAuthStore } from '../stores/authStore';
import { useDevPlanControls } from '../hooks/useDevPlanControls';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useHapticsPreference } from '../hooks/useHapticsPreference';
import { useAudioPreferences } from '../features/audioSettings/useAudioPreferences';
import { useCompletionSound } from '../hooks/useCompletionSound';
import RoutineFirstCompletionModal from '../features/selfCare/RoutineFirstCompletionModal';
import { trackProfileAction } from '../services/analytics/tracking';
import { restorePaywallPurchases } from '../services/paywall';
import { resetReviewPromptState } from '../services/reviews/reviewPromptState';
import { clearSurveyOfferDismissed } from '../services/preferences/surveyOfferPreference';
import { setSurveyOfferForced } from '../hooks/devSurveyOfferOverride';
import { forceEnjoymentPrompt } from '../features/enjoymentPrompt/useEnjoymentPrompt';
import { setCoachingOfferForced } from '../features/coaching/useCoachingOffer';
import { forceNextDayComplete } from '../features/room/devDayCompleteOverride';
import { publishRevenueCatEntitlement } from '../queries/subscriptions/entitlementCache';
import { getCurrentRevenueCatAppUserId } from '../services/subscriptions/revenueCatClient';
import type { SettingsScreenProps } from '../app/navigation';
import { subscribeToClosingTransitionEnd } from '../app/navigation/useOpeningTransitionComplete';
import { returnToHome } from '../app/navigation/returnToHome';
import { resetFutureSelfLetterSeen } from '../features/letters/useFutureSelfLetter';
import { getHeartRatePlacementGuidance } from '../lib/heartRate/captureGuidance';
import ScreenContent from '../components/common/ScreenContent';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useExitOfferStore } from '../stores/exitOfferStore';
import { askAiDataConsent } from '../features/aiConsent/ensureAiDataConsent';
import { useAiDataConsentSetting } from '../features/aiConsent/useAiDataConsentSetting';
import { resetRoutineFirstTodoDevState } from '../services/debug/resetRoutineFirstTodoDevState';
import { getSelfCareGoalsQueryKey } from '../queries/selfCare/useSelfCareGoalsQuery';
import { invalidateStreakQueries } from '../queries/tracking/invalidateStreakQueries';
import { setTourSeen } from '../services/preferences/tourSeenPreference';
import { useTourStore } from '../features/tour/tourStore';
import { prepareTourDestinations } from '../features/tour/prepareTourDestinations';
import { EARN_RATES } from '../lib/wallet/coins';
import RewardAnimationPreload from '../features/plan/RewardAnimationPreload';

const FEEDBACK_EMAIL = 'feedback@tryazora.app';
const FEEDBACK_CC_EMAIL = 'kevin@tryazora.app';

const EXIT_OFFER_PREVIEWS = [
  { label: 'Preview post-tour offer, free trial (dev)', variant: 'gift', preview: { trial: 'free' } },
  { label: 'Preview cancel offer, free trial (dev)', variant: 'priceDrop', preview: { trial: 'free' } },
  { label: 'Preview post-tour offer, monthly paid trial (dev)', variant: 'gift', preview: { period: 'month', trial: 'paid' } },
  { label: 'Preview cancel offer, monthly paid trial (dev)', variant: 'priceDrop', preview: { period: 'month', trial: 'paid' } },
  { label: 'Preview post-tour offer, weekly paid trial (dev)', variant: 'gift', preview: { period: 'week', trial: 'paid' } },
  { label: 'Preview cancel offer, weekly paid trial (dev)', variant: 'priceDrop', preview: { period: 'week', trial: 'paid' } },
  { label: 'Preview post-tour offer, monthly (dev)', variant: 'gift', preview: { period: 'month' } },
  { label: 'Preview cancel offer, monthly (dev)', variant: 'priceDrop', preview: { period: 'month' } },
  { label: 'Preview post-tour offer, weekly (dev)', variant: 'gift', preview: { period: 'week' } },
  { label: 'Preview cancel offer, weekly (dev)', variant: 'priceDrop', preview: { period: 'week' } },
] as const;

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { scrollY, onScroll } = useCollapsingTitle();
  const user = useAuthStore((s) => s.user);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [streakPreviewVisible, setStreakPreviewVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const queryClient = useQueryClient();
  const replayingTourRef = useRef(false);
  const planDev = useDevPlanControls(user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const { hapticsEnabled, setHapticsEnabled } = useHapticsPreference();
  const { preferences: audioPreferences, setSoundEffects } = useAudioPreferences();
  const aiDataConsent = useAiDataConsentSetting(user?.id ?? null, navigation);
  const playStreakPreviewSound = useCompletionSound('streak', { active: streakPreviewVisible });

  const handleRestorePurchases = async () => {
    if (restoring) return;
    setRestoring(true);
    trackProfileAction('restore_purchases_started');
    try {
      const result = await restorePaywallPurchases();
      if (result.status === 'restored' && result.isPro) {
        const published = await publishRevenueCatEntitlement(
          queryClient, result.appUserId, result.customerInfo,
          () => result.appUserId === user?.id &&
            useAuthStore.getState().user?.id === result.appUserId &&
            getCurrentRevenueCatAppUserId() === result.appUserId,
        );
        if (!published) return;
        trackProfileAction('restore_purchases_succeeded');
        Alert.alert('Restored', 'Your subscription is active again.');
        return;
      }
      trackProfileAction('restore_purchases_failed', { status: result.status });
      if (result.status === 'failed') {
        Alert.alert(
          'Restore did not finish',
          'Check your connection and try again in a moment.',
        );
        return;
      }
      Alert.alert(
        'Nothing to restore',
        'We could not find a subscription on this account. Make sure the store is signed in to the account that bought it.',
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleShowSurveyOffer = () => {
    setSurveyOfferForced(true);
    void clearSurveyOfferDismissed().then(() => {
      Alert.alert(
        'Survey offer shown',
        'The stored dismissal is cleared and the offer is on Home now.',
        [{ text: 'Go to Home', onPress: () => returnToHome(navigation) }],
      );
    });
  };

  const handleSendFeedback = async () => {
    trackProfileAction('send_feedback_opened');
    const subject = encodeURIComponent('Azora feedback');
    const body = encodeURIComponent(
      'Hi Azora team,\n\nI wanted to share some feedback:\n\n',
    );
    const cc = encodeURIComponent(FEEDBACK_CC_EMAIL);
    const mailto = `mailto:${FEEDBACK_EMAIL}?cc=${cc}&subject=${subject}&body=${body}`;
    try {
      const supported = await Linking.canOpenURL(mailto);
      if (!supported) {
        Alert.alert(
          'No mail app found',
          `Please send feedback to ${FEEDBACK_EMAIL}.`,
        );
        return;
      }
      await Linking.openURL(mailto);
    } catch {
      Alert.alert(
        'Could not open mail',
        `Please send feedback to ${FEEDBACK_EMAIL}.`,
      );
    }
  };

  const handleHeartRateAccuracyHelp = () => {
    const placementGuidance = getHeartRatePlacementGuidance(
      Device.modelName,
      Device.modelId,
    );
    trackProfileAction('heart_rate_accuracy_help_opened');
    Alert.alert(
      placementGuidance.title,
      [
        placementGuidance.instruction,
        '',
        placementGuidance.multiCameraWarning,
        '',
        ...placementGuidance.steps.map(
          (step, index) => `${index + 1}. ${step.title}: ${step.detail}`,
        ),
      ].join('\n'),
      [{ text: 'Got it' }],
    );
  };

  /**
   * The tour always ends on its lesson stop. `withFollowUp` replays what a
   * just-onboarded free user gets after it too: the streak popup, the confetti
   * and the one-time offer. The popup is forced, so it shows even on a day
   * that already has a win.
   */
  const startTourReplay = async (withFollowUp: boolean) => {
    if (replayingTourRef.current) return;
    replayingTourRef.current = true;

    try {
      // `useAppTour` only reads the stored flag while booting. A dev replay
      // therefore resets storage and starts the live store after Settings has
      // closed, rather than waiting for a remount that never happens.
      useTourStore.getState().prepare();
      if (withFollowUp) {
        useFirstWinOfDayStore.getState().forceNext();
        useExitOfferStore.getState().setPending(true);
      }
      await setTourSeen(false);
      const destinationPreparation = prepareTourDestinations(
        queryClient,
        user?.id ?? null,
        todayLocalDate,
      );

      let unsubscribe = () => {};
      unsubscribe = subscribeToClosingTransitionEnd(
        (listener) => navigation.addListener('transitionEnd', listener),
        () => {
          unsubscribe();
          // A replay must have the same cache warm-up as first launch, without
          // making an offline request keep Settings' tour in limbo.
          void destinationPreparation;
          useTourStore.getState().start();
          replayingTourRef.current = false;
        },
      );
      returnToHome(navigation);
    } catch {
      replayingTourRef.current = false;
      Alert.alert('Could not replay the Azo tour', 'Try again in a moment.');
    }
  };

  const handleReplayTour = () => {
    Alert.alert(
      'Replay Azo tour?',
      'This returns you Home and replays the tour, ending on the lesson stop. It will not start or record a breathing session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replay tour',
          onPress: () => {
            void startTourReplay(false);
          },
        },
      ],
    );
  };

  const handleReplayPostOnboardingFlow = () => {
    Alert.alert(
      'Replay post-onboarding flow?',
      'The tour and its lesson stop, then the streak popup, confetti and the one-time offer. Finishing the lesson records it for today if it is not read yet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replay flow',
          onPress: () => {
            void startTourReplay(true);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <CollapsingBackTitle title="Settings" style={{ paddingBottom: spacing.lg }} />
        <ScreenContent width="grouped">
          <View style={styles.section}>
            <SectionHeader title="Preferences" />
            <SettingsGroup>
              <SettingsRow
                icon="bell-outline"
                label="Notifications"
                onPress={() => {
                  trackProfileAction('notifications_opened');
                  setNotificationsVisible(true);
                }}
              />
              <SettingsRow
                icon="vibrate"
                label="Haptics"
                showChevron={false}
                rightSlot={
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={(enabled) => {
                      setHapticsEnabled(enabled);
                      trackProfileAction('haptics_toggled', { enabled });
                    }}
                    trackColor={{
                      false: colors.neutral[300],
                      true: colors.primary.blue300,
                    }}
                    thumbColor={hapticsEnabled ? colors.primary.blue500 : colors.neutral[50]}
                  />
                }
              />
              <SettingsRow
                icon="sound-effects"
                label="Sound effects"
                showChevron={false}
                rightSlot={
                  <Switch
                    accessibilityLabel="Sound effects"
                    value={audioPreferences.soundEffects}
                    onValueChange={setSoundEffects}
                    trackColor={{
                      false: colors.neutral[300],
                      true: colors.primary.blue300,
                    }}
                    thumbColor={audioPreferences.soundEffects ? colors.primary.blue500 : colors.neutral[50]}
                  />
                }
              />
              <SettingsRow
                icon="shield-lock-outline"
                label="AI features (Google Gemini)"
                showChevron={false}
                rightSlot={
                  <Switch
                    accessibilityLabel="AI features (Google Gemini)"
                    value={aiDataConsent.allowed}
                    onValueChange={(next) => { void aiDataConsent.change(next); }}
                    trackColor={{
                      false: colors.neutral[300],
                      true: colors.primary.blue300,
                    }}
                    thumbColor={aiDataConsent.allowed ? colors.primary.blue500 : colors.neutral[50]}
                  />
                }
              />
              <SettingsRow
                icon="lock-outline"
                label="Azo’s Secret Layer"
                onPress={() => navigation.navigate('AzoSecretLayer')}
                isLast
              />
            </SettingsGroup>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Subscription" />
            <SettingsGroup>
              <SettingsRow
                icon="restore"
                label={restoring ? 'Restoring…' : 'Restore purchases'}
                onPress={() => {
                  void handleRestorePurchases();
                }}
                isLast
              />
            </SettingsGroup>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Support" />
            <SettingsGroup>
              <SettingsRow
                icon="heart-pulse"
                label="Help, my heart rate isn't accurate"
                onPress={handleHeartRateAccuracyHelp}
              />
              <SettingsRow
                icon="email-outline"
                label="Send feedback"
                onPress={() => {
                  void handleSendFeedback();
                }}
                isLast
              />
            </SettingsGroup>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Legal" />
            <SettingsGroup>
              <SettingsRow
                icon="shield-lock-outline"
                label="Privacy policy"
                onPress={() => {
                  trackProfileAction('privacy_policy_opened');
                  void Linking.openURL('https://www.tryazora.app/privacy');
                }}
              />
              <SettingsRow
                icon="file-document-outline"
                label="Terms of service"
                onPress={() => {
                  trackProfileAction('terms_opened');
                  void Linking.openURL('https://www.tryazora.app/terms');
                }}
                isLast
              />
            </SettingsGroup>
          </View>

          {__DEV__ ? (
            <View style={styles.section}>
              <SettingsGroup>
                <SettingsRow
                  label="Preview AI consent prompt (dev)"
                  onPress={() => { void askAiDataConsent(navigation); }}
                />
                <SettingsRow
                  label="Show future-you letter again (dev)"
                  onPress={() => {
                    if (user?.id == null) return;
                    void resetFutureSelfLetterSeen(queryClient, user.id).then(() =>
                      returnToHome(navigation),
                    );
                  }}
                />
                <SettingsRow
                  label="Preview enjoying Azora (dev)"
                  onPress={() => {
                    forceEnjoymentPrompt();
                    returnToHome(navigation);
                  }}
                />
                <SettingsRow
                  label="Preview post-tour offer (dev)"
                  onPress={() => navigation.navigate('ExitOffer', { variant: 'gift' })}
                />
                <SettingsRow
                  label="Preview cancel offer (dev)"
                  onPress={() => navigation.navigate('ExitOffer', { variant: 'priceDrop' })}
                />
                {EXIT_OFFER_PREVIEWS.map(({ label, variant, preview }) => (
                  <SettingsRow
                    key={label}
                    label={label}
                    onPress={() => navigation.navigate('ExitOffer', { variant, preview })}
                  />
                ))}
                <SettingsRow
                  label="Room lab (dev)"
                  onPress={() => navigation.navigate('RoomLab')}
                />
                <SettingsRow
                  label="Plan lab (dev)"
                  onPress={() => navigation.navigate('PlanLab')}
                />
                <SettingsRow
                  label="Lesson lab (dev)"
                  onPress={() => navigation.navigate('LessonLab')}
                />
                <SettingsRow
                  label="Preview skills in practice (dev)"
                  onPress={() => navigation.navigate('SkillsInPractice', { preview: true })}
                />
                <SettingsRow
                  label="Onboarding lab (dev)"
                  onPress={() => navigation.navigate('OnboardingLab')}
                />
                <SettingsRow
                  label="Preview pact contract (dev)"
                  onPress={() => navigation.navigate('PactPreview')}
                />
                <SettingsRow
                  label="Preview pact celebration (dev)"
                  onPress={() => navigation.navigate('PactCelebrationPreview')}
                />
                <SettingsRow
                  label="Preview Pro welcome, trial (dev)"
                  onPress={() => navigation.navigate('ProWelcomePreview', { trialDays: 7 })}
                />
                <SettingsRow
                  label="Preview Pro welcome, no trial (dev)"
                  onPress={() => navigation.navigate('ProWelcomePreview', { trialDays: null })}
                />
                <SettingsRow
                  label="Preview onboarding paywall, steps (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck' })}
                />
                <SettingsRow
                  label="Preview plan paywall, free trial (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'plan' })}
                />
                <SettingsRow
                  label="Preview plan paywall, cleaning (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'plan', cleaning: true })}
                />
                <SettingsRow
                  label="Preview steps paywall, opens on plan (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck_plan' })}
                />
                <SettingsRow
                  label="Preview paywall plans: weekly, trials, any paywall (dev)"
                  onPress={() => navigation.navigate('PaywallPlanPreviews')}
                />
                <SettingsRow
                  label="Preview plan paywall, paid trial (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'plan', onlyPackageId: 'monthly' })}
                />
                <SettingsRow
                  label="Preview onboarding paywall, long (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'long' })}
                />
                <SettingsRow
                  label="Preview onboarding paywall, long cleaning headline (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'long', cleaning: true })}
                />
                <SettingsRow
                  label="Preview onboarding paywall, long then trial (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'long_then_trial' })}
                />
                <SettingsRow
                  label="Preview design your trial (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck', initialStep: 'plan' })}
                />
                <SettingsRow
                  label="Preview design your trial, paid trial only (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck', onlyPackageId: 'monthly' })}
                />
                <SettingsRow
                  label="Preview design your trial, annual paid trial only (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck', onlyPackageId: 'annual' })}
                />
                <SettingsRow
                  label="Preview design your trial, annual + weekly paid trials (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck', plans: 'annualWeekly' })}
                />
                <SettingsRow
                  label="Preview design your trial, monthly + weekly paid trials (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck', plans: 'monthlyWeekly' })}
                />
                <SettingsRow
                  label="Preview design your trial, side by side (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck', initialStep: 'plan', planPicker: 'side_by_side' })}
                />
                <SettingsRow
                  label="Preview design your trial, side by side, annual + weekly paid trials (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck', plans: 'annualWeekly', planPicker: 'side_by_side' })}
                />
                <SettingsRow
                  label="Preview design your trial, side by side, monthly + weekly paid trials (dev)"
                  onPress={() => navigation.navigate('OnboardingPaywallPreview', { layout: 'deck', plans: 'monthlyWeekly', planPicker: 'side_by_side' })}
                />
                <SettingsRow
                  label="Preview breathing result (dev)"
                  onPress={() =>
                    navigation.navigate('SessionComplete', {
                      techniqueId: 'box',
                      techniqueName: 'Box Breathing',
                      breathCount: 24,
                      targetBreaths: 24,
                      durationSec: 240,
                      targetSec: 240,
                      cycles: 6,
                      targetCycles: 6,
                      avgBpm: 68,
                      coins: EARN_RATES.planActivity,
                      preview: true,
                    })
                  }
                />
                <SettingsRow
                  label="Preview streak popup (dev)"
                  onPress={() => setStreakPreviewVisible(true)}
                />
                <SettingsRow
                  label="Preview lesson reward (dev)"
                  onPress={() =>
                    navigation.navigate('ActivityReward', { kind: 'lesson', coins: EARN_RATES.lessonOrCheckIn })
                  }
                />
                <SettingsRow
                  label="Preview habit claim (dev)"
                  onPress={() => Alert.alert(
                    'Preview habit claim',
                    'Repeat this as often as you like. Your habits, coins and plan stay unchanged.',
                    [
                      { text: 'Quick', onPress: () => navigation.navigate('ActivityReward', { kind: 'todo', previewClaim: 'quick' }) },
                      { text: 'Slow save', onPress: () => navigation.navigate('ActivityReward', { kind: 'todo', previewClaim: 'slow' }) },
                      { text: 'Fail then retry', onPress: () => navigation.navigate('ActivityReward', { kind: 'todo', previewClaim: 'retry' }) },
                    ],
                    { cancelable: true },
                  )}
                />
                <SettingsRow
                  label="Preview Reset reward (dev)"
                  onPress={() =>
                    navigation.navigate('ActivityReward', {
                      kind: 'reset',
                      resetName: '5-4-3-2-1',
                      coins: EARN_RATES.planActivity,
                    })
                  }
                />
                <SettingsRow
                  label="Celebrate next plan item (dev)"
                  onPress={() => {
                    forceNextDayComplete();
                    Alert.alert(
                      'Day-complete armed',
                      'Finish a lesson, mood check-in or plan exercise to see the day-complete screen, whatever else is left today.',
                    );
                  }}
                />
                <SettingsRow
                  label="Replay Azo tour (dev)"
                  onPress={handleReplayTour}
                />
                <SettingsRow
                  label="Replay post-onboarding flow (dev)"
                  onPress={handleReplayPostOnboardingFlow}
                />
                <SettingsRow
                  label="Preview photo cleanup (dev)"
                  onPress={() => navigation.navigate('PhotoCleanup', { preview: true })}
                />
                <SettingsRow
                  label="Reset review prompt (dev)"
                  onPress={() => {
                    void resetReviewPromptState().then(() => {
                      Alert.alert('Review prompt reset', 'The budget and streak are cleared.');
                    });
                  }}
                />
                <SettingsRow
                  label="Show survey offer (dev)"
                  onPress={handleShowSurveyOffer}
                />
                <SettingsRow
                  label="Preview coaching survey (dev)"
                  onPress={() => navigation.navigate('CoachingSurvey', { preview: true })}
                />
                <SettingsRow
                  label="Show coaching card on Home (dev)"
                  onPress={() => setCoachingOfferForced(true)}
                />
                <SettingsRow
                  label="Reset routine first-todo streak (dev)"
                  onPress={() => {
                    if (user?.id == null) return;
                    Alert.alert(
                      'Reset routine test state?',
                      'Clears today’s completed routine to-dos and the 3-day tactic so the next checked to-do opens the streak popup again.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reset',
                          style: 'destructive',
                          onPress: () => {
                            void resetRoutineFirstTodoDevState(user.id, todayLocalDate)
                              .then(async () => {
                                await queryClient.invalidateQueries({
                                  queryKey: getSelfCareGoalsQueryKey(user.id, todayLocalDate),
                                  exact: true,
                                });
                                await invalidateStreakQueries(queryClient, user.id);
                                Alert.alert('Routine test state reset', 'Check any routine to-do to replay the popup.');
                              })
                              .catch(() => Alert.alert('Could not reset routine test state.'));
                          },
                        },
                      ],
                    );
                  }}
                />
                {/* The two states a plan tab cannot otherwise be put into:
                    no plan at all, and one that has been finished. Both
                    write a real row, so both ask first. */}
                <SettingsRow
                  label={
                    planDev == null
                      ? 'No plan to clear (dev)'
                      : `Clear my plan — ${planDev.planId} (dev)`
                  }
                  onPress={() => {
                    if (planDev == null) {
                      Alert.alert(
                        'No plan on this account',
                        'That is the state the start screen is for. Open the plan tab to see it.',
                      );
                      return;
                    }

                    Alert.alert(
                      'Clear your plan?',
                      'The plan tab goes back to offering you one. This cannot be undone: starting again begins at day one.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Clear',
                          style: 'destructive',
                          onPress: planDev.clear,
                        },
                      ],
                    );
                  }}
                />
                <SettingsRow
                  label={
                    planDev == null
                      ? 'No plan to finish (dev)'
                      : `Finish my plan — ${planDev.planId} (dev)`
                  }
                  onPress={() => {
                    if (planDev == null) {
                      Alert.alert(
                        'No plan on this account',
                        'Start one from the plan tab first.',
                      );
                      return;
                    }

                    Alert.alert(
                      'Finish your plan?',
                      'Marks the plan done, so the plan tab shows every week finished and offers you a new one. Home keeps whichever day you are on rather than the last one — the day counter is server-owned and cannot be moved from here.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Finish',
                          style: 'destructive',
                          onPress: planDev.finish,
                        },
                      ],
                    );
                  }}
                  isLast
                />
              </SettingsGroup>
            </View>
          ) : null}

          <View style={styles.section}>
            <SettingsGroup>
              <SettingsRow
                label="Account management"
                onPress={() => navigation.navigate('AccountManagement')}
                isLast
              />
            </SettingsGroup>
          </View>
        </ScreenContent>
      </Animated.ScrollView>
      <CollapsingTitleBar title="Settings" scrollY={scrollY} />

      <NotificationsSettingsSheet
        visible={notificationsVisible}
        userId={user?.id ?? null}
        onClose={() => {
          setNotificationsVisible(false);
        }}
      />
      {__DEV__ ? (
        <>
          <RewardAnimationPreload pose="proud" />
          <RoutineFirstCompletionModal
            visible={streakPreviewVisible}
            onIgnite={playStreakPreviewSound}
            streakDays={1}
            completedDaysAgo={[0]}
            onCommitStreakGoal={() => {}}
            onContinue={() => setStreakPreviewVisible(false)}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['7xl'] + spacing.xl,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.lg,
  },
});
