import { Text } from '../components/common/Text';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import * as Device from 'expo-device';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import SettingsGroup from '../components/settings/SettingsGroup';
import SettingsRow from '../components/settings/SettingsRow';
import NotificationsSettingsSheet from '../features/notifications/NotificationsSettingsSheet';
import { useAuthStore } from '../stores/authStore';
import { useDevPlanControls } from '../hooks/useDevPlanControls';
import { useHapticsPreference } from '../hooks/useHapticsPreference';
import { trackProfileAction } from '../services/analytics/tracking';
import { restorePaywallPurchases } from '../services/paywall';
import { resetReviewPromptState } from '../services/reviews/reviewPromptState';
import { clearSurveyOfferDismissed } from '../services/preferences/surveyOfferPreference';
import { setSurveyOfferForced } from '../hooks/devSurveyOfferOverride';
import { getUserEntitlementQueryKey } from '../queries/subscriptions/useUserEntitlementQuery';
import type { SettingsScreenProps } from '../app/navigation';
import { subscribeToClosingTransitionEnd } from '../app/navigation/useOpeningTransitionComplete';
import { returnToHome } from '../app/navigation/returnToHome';
import { getHeartRatePlacementGuidance } from '../lib/heartRate/captureGuidance';
import ScreenContent from '../components/common/ScreenContent';
import ProfileDisplayNameEditorDialog from '../components/profile/ProfileDisplayNameEditorDialog';
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard';
import { useProfileEditing } from '../hooks/useProfileEditing';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useUserDefaultTechniqueQuery } from '../queries/profile/useUserDefaultTechniqueQuery';
import { isTechniqueId } from '../features/exercise/guidedBreathing/techniqueCatalog';
import {
  previewFirstSessionEnding,
  replayFullFirstSessionFlow,
} from '../features/tour/firstSessionActivationStore';
import { buildSessionKey } from '../lib/sessionKey';

const FEEDBACK_EMAIL = 'feedback@tryazora.app';
const FEEDBACK_CC_EMAIL = 'kevin@tryazora.app';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const queryClient = useQueryClient();
  const replayingTourRef = useRef(false);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const profileEditing = useProfileEditing(user?.id ?? null);
  const profileSummary = profileSummaryQuery.data;
  const displayName = profileSummary?.profile?.displayName ?? '—';
  const defaultTechniqueQuery = useUserDefaultTechniqueQuery(user?.id ?? null);
  const planDev = useDevPlanControls(user?.id ?? null);
  const { hapticsEnabled, setHapticsEnabled } = useHapticsPreference();

  const handleRestorePurchases = async () => {
    if (restoring) return;
    setRestoring(true);
    trackProfileAction('restore_purchases_started');
    try {
      const result = await restorePaywallPurchases();
      if (result.status === 'restored' && result.isPro) {
        await queryClient.invalidateQueries({
          queryKey: getUserEntitlementQueryKey(user?.id ?? null),
        });
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
    const entitlement = queryClient.getQueryData(
      getUserEntitlementQueryKey(user?.id ?? null),
    ) as { isPro?: boolean } | undefined;

    setSurveyOfferForced(true);
    void clearSurveyOfferDismissed().then(() => {
      Alert.alert(
        'Survey offer shown',
        entitlement?.isPro === true
          ? 'This account is Pro, so the real offer would stay hidden. It is being forced on for this session.'
          : 'The stored dismissal is cleared and the offer is on Home now.',
        [{ text: 'Go to Home', onPress: () => returnToHome(navigation) }],
      );
    });
  };

  const handleSignOut = () => {
    if (signingOut) return;
    trackProfileAction('sign_out_prompt_opened');
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          trackProfileAction('sign_out_cancelled');
        },
      },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          trackProfileAction('sign_out_confirmed');
          setSigningOut(true);
          try {
            await signOut();
            trackProfileAction('sign_out_succeeded');
          } catch (err) {
            trackProfileAction('sign_out_failed', {
              error_message: err instanceof Error ? err.message : 'unknown_error',
            });
            const message = err instanceof Error ? err.message : 'Please try again.';
            Alert.alert('Sign out failed', message);
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (deletingAccount) return;
    trackProfileAction('delete_account_prompt_opened');
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all data. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            trackProfileAction('delete_account_cancelled');
          },
        },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            trackProfileAction('delete_account_confirmed');
            Alert.alert(
              'Are you sure?',
              'All your sessions, stats, and progress will be gone forever.',
              [
                {
                  text: 'Keep my account',
                  style: 'cancel',
                  onPress: () => {
                    trackProfileAction('delete_account_second_cancelled');
                  },
                },
                {
                  text: 'Yes, delete everything',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await deleteAccount();
                      trackProfileAction('delete_account_succeeded');
                    } catch (err) {
                      trackProfileAction('delete_account_failed', {
                        error_message: err instanceof Error ? err.message : 'unknown_error',
                      });
                      const message = err instanceof Error ? err.message : 'Please try again.';
                      Alert.alert('Delete account failed', message);
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
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

  const startFullFirstSessionReplay = (userId: string, techniqueId: string) => {
    if (replayingTourRef.current) return;
    replayingTourRef.current = true;

    // Home is frozen underneath Settings. Start the tour only after the native
    // close finishes so its first target can be measured in the visible window.
    let unsubscribe = () => {};
    unsubscribe = subscribeToClosingTransitionEnd(
      (listener) => navigation.addListener('transitionEnd', listener),
      () => {
        unsubscribe();
        void replayFullFirstSessionFlow(userId, techniqueId);
      },
    );
    returnToHome(navigation);
  };

  /**
   * Dev only. Sample numbers, because the point is the two stops around the
   * result screen, not what it says. The screen's own daily and room tracking
   * reads this account's real state rather than these, so nothing is claimed
   * that has not actually been earned.
   */
  const handlePreviewFirstSessionEnding = () => {
    if (user == null) {
      Alert.alert('No signed-in user', 'Sign in before previewing this flow.');
      return;
    }
    const techniqueId = 'box';

    previewFirstSessionEnding(user.id);
    navigation.replace('SessionComplete', {
      techniqueId,
      techniqueName: 'Box Breathing',
      sessionKey: buildSessionKey(techniqueId, Date.now()),
      breathCount: 12,
      targetBreaths: 12,
      durationSec: 60,
      targetSec: 60,
      cycles: 12,
      targetCycles: 12,
      firstSessionActivation: true,
    });
  };

  const handleReplayFirstSessionFlow = () => {
    if (replayingTourRef.current) return;
    if (user == null) {
      Alert.alert('No signed-in user', 'Sign in before replaying this flow.');
      return;
    }
    if (defaultTechniqueQuery.isPending) {
      Alert.alert('Personalization is loading', 'Try again in a moment.');
      return;
    }
    const techniqueId = defaultTechniqueQuery.data;
    if (!isTechniqueId(techniqueId)) {
      Alert.alert(
        'No personalized exercise',
        'This account does not have a valid saved default technique.',
      );
      return;
    }

    Alert.alert(
      'Replay the full first-session flow?',
      'This runs the informational tour and required exercise. Completing it records a real breathing session for this account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replay flow',
          onPress: () => startFullFirstSessionReplay(user.id, techniqueId),
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped">
          <View style={styles.topSection}>
            <AppTopBar
              showAvatar={false}
              showStreak={false}
              leftSlot={
                <View style={styles.headerLeft}>
                  <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={12}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={28}
                      color={colors.text.primary}
                    />
                  </Pressable>
                  <Text style={styles.headerTitle}>Settings</Text>
                </View>
              }
            />
          </View>

          <View style={styles.profileSection}>
            <ProfileIdentityCard
              displayName={displayName}
              avatarUrl={profileSummary?.profile?.avatarUrl}
              totalBreaths={profileSummary?.totalBreaths ?? 0}
              totalSessions={profileSummary?.totalSessions ?? 0}
              currentStreak={profileSummary?.currentStreak ?? 0}
              isUploading={profileEditing.isUploading}
              onChangePhoto={profileEditing.changePhoto}
              onEditDisplayName={profileEditing.editDisplayName}
            />
          </View>

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
                isLast
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
                  label="Preview exit offer (dev)"
                  onPress={() => navigation.navigate('ExitOffer')}
                />
                <SettingsRow
                  label="Room lab (dev)"
                  onPress={() => navigation.navigate('RoomLab')}
                />
                <SettingsRow
                  label="Plan lab (dev)"
                  onPress={() => navigation.navigate('PlanLab')}
                />
                <SettingsRow
                  label="Replay full first-session flow (dev)"
                  onPress={handleReplayFirstSessionFlow}
                />
                <SettingsRow
                  label="Preview first-Reset ending (dev)"
                  onPress={handlePreviewFirstSessionEnding}
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

          <View style={[styles.section, styles.accountActions]}>
            <SettingsGroup>
              <SettingsRow label="Sign out" onPress={handleSignOut} centered isLast />
            </SettingsGroup>
            <SettingsGroup>
              <SettingsRow
                label="Delete account"
                onPress={handleDeleteAccount}
                destructive
                centered
                isLast
              />
            </SettingsGroup>
          </View>
        </ScreenContent>
      </ScrollView>

      <NotificationsSettingsSheet
        visible={notificationsVisible}
        userId={user?.id ?? null}
        onClose={() => {
          setNotificationsVisible(false);
        }}
      />
      <ProfileDisplayNameEditorDialog
        visible={profileEditing.editingDisplayName}
        displayName={displayName}
        isSaving={profileEditing.isSaving}
        onCancel={profileEditing.cancelEditingDisplayName}
        onSave={profileEditing.saveDisplayName}
      />
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
  topSection: {
    paddingBottom: spacing.xl,
  },
  profileSection: {
    paddingHorizontal: padding.screen.horizontal,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.lg,
  },
  // Sign out and delete belong together at the foot of the page, so they sit a
  // card gap apart rather than a full section gap.
  accountActions: {
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.6,
  },
});
