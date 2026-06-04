import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import SettingsGroup from '../components/settings/SettingsGroup';
import SettingsRow from '../components/settings/SettingsRow';
import NotificationsSettingsSheet from '../features/notifications/NotificationsSettingsSheet';
import { useAuthStore } from '../stores/authStore';
import { useHapticsPreference } from '../hooks/useHapticsPreference';
import { trackProfileAction } from '../services/analytics/tracking';
import { getRevenueCatCustomerInfo } from '../services/subscriptions/revenueCatClient';
import type { SettingsScreenProps } from '../app/navigation';

const APP_STORE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
const FEEDBACK_EMAIL = 'feedback@tryazora.app';
const FEEDBACK_CC_EMAIL = 'kevin@tryazora.app';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const { hapticsEnabled, setHapticsEnabled } = useHapticsPreference();

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
    trackProfileAction('heart_rate_accuracy_help_opened');
    Alert.alert(
      'Help, my heart rate isn\'t accurate',
      [
        'For the best reading:',
        '',
        '1. Place the soft pad of your fingertip over the rear camera and flash.',
        '2. Cover the lens fully, but do not press hard.',
        '3. Keep your finger and phone still for the full reading.',
        '4. Rest your hand on a table or against your body if possible.',
        '5. Breathe normally and stay relaxed until it finishes.',
        '',
        'Cold hands, wet fingers, bright light, movement, or too much pressure can make the reading jump around.',
      ].join('\n'),
      [{ text: 'Got it' }],
    );
  };

  const handleManageSubscription = async () => {
    trackProfileAction('manage_subscription_opened');

    try {
      const customerInfo = await getRevenueCatCustomerInfo();
      const managementUrl = customerInfo.managementURL ?? APP_STORE_SUBSCRIPTIONS_URL;
      await Linking.openURL(managementUrl);
    } catch (err) {
      trackProfileAction('manage_subscription_failed', {
        error_message: err instanceof Error ? err.message : 'unknown_error',
      });

      try {
        await Linking.openURL(APP_STORE_SUBSCRIPTIONS_URL);
      } catch {
        Alert.alert(
          'Could not open subscriptions',
          'Open App Store account settings to manage your subscription.',
        );
      }
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <AppTopBar
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

        <View style={styles.section}>
          <SectionHeader title="Preferences" />
          <View style={styles.sectionBody}>
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
                    thumbColor={hapticsEnabled ? colors.primary.blue600 : colors.neutral[50]}
                  />
                }
              />
            </SettingsGroup>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Subscription" />
          <View style={styles.sectionBody}>
            <SettingsGroup>
              <SettingsRow
                icon="star-four-points-outline"
                label="Manage subscription"
                onPress={() => {
                  void handleManageSubscription();
                }}
                isLast
              />
            </SettingsGroup>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Support" />
          <View style={styles.sectionBody}>
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
        </View>

        <View style={styles.section}>
          <SectionHeader title="Legal" />
          <View style={styles.sectionBody}>
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
        </View>

        {__DEV__ ? (
          <View style={styles.section}>
            <SettingsGroup>
              <SettingsRow
                label="Preview exit offer (dev)"
                onPress={() => navigation.navigate('ExitOffer')}
                isLast
              />
            </SettingsGroup>
          </View>
        ) : null}

        <View style={styles.section}>
          <SettingsGroup>
            <SettingsRow label="Sign out" onPress={handleSignOut} centered isLast />
          </SettingsGroup>
        </View>

        <View style={styles.section}>
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

      </ScrollView>

      <NotificationsSettingsSheet
        visible={notificationsVisible}
        userId={user?.id ?? null}
        onClose={() => {
          setNotificationsVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['7xl'] + spacing.xl,
  },
  topSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionBody: {
    marginTop: spacing.xs,
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
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.6,
  },
});
