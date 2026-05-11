import { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import HomeTopMesh from '../components/home/HomeTopMesh';
import SectionHeader from '../components/common/SectionHeader';
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard';
import ProfileStatsGrid, {
  type ProfileStatBadge,
  type ProfileStatHero,
} from '../components/profile/ProfileStatsGrid';
import ProfileCompletionCalendarCard from '../components/profile/ProfileCompletionCalendarCard';
import ProfileBreathHoldTrendCard from '../components/profile/ProfileBreathHoldTrendCard';
import ProfileAccountCard from '../components/profile/ProfileAccountCard';
import { useAuthStore } from '../stores/authStore';
import type { ProfileScreenProps } from '../app/navigation';
import { trackProfileAction } from '../services/analytics/tracking';
import { useHapticsPreference } from '../hooks/useHapticsPreference';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { formatProfileHoldTime } from '../services/profile/profileSummaryService';
import { useUploadProfileAvatarMutation } from '../queries/profile/useUploadProfileAvatarMutation';
import { getRevenueCatCustomerInfo } from '../services/subscriptions/revenueCatClient';

const APP_STORE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

function getFallbackDisplayName(email: string | undefined): string {
  if (email == null) {
    return 'Azora athlete';
  }

  return email.split('@')[0] || 'Azora athlete';
}

function getAvatarLabel(displayName: string): string {
  const words = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'A';
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function ProfileScreen(_: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { hapticsEnabled, setHapticsEnabled } = useHapticsPreference();
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const uploadAvatarMutation = useUploadProfileAvatarMutation(user?.id ?? null);

  const profileSummary = profileSummaryQuery.data;
  const displayName =
    profileSummary?.profile?.displayName ?? getFallbackDisplayName(user?.email);
  const avatarLabel = getAvatarLabel(displayName);

  const profileHero: ProfileStatHero = useMemo(() => {
    const longestHoldSeconds = profileSummary?.longestHoldSeconds ?? null;
    const trend = profileSummary?.breathHoldTrend.map((point) => point.value) ?? [];

    return {
      label: 'Longest hold',
      value: formatProfileHoldTime(longestHoldSeconds),
      detail: longestHoldSeconds == null ? 'No breath holds yet' : 'Personal best',
      icon: 'breath-hold',
      trend,
    };
  }, [profileSummary]);

  const profileSecondary: ProfileStatBadge[] = useMemo(
    () => [
      {
        label: 'Best streak',
        value: String(profileSummary?.longestStreak ?? 0),
        detail: 'days',
        icon: 'streak',
      },
      {
        label: 'Breath holds',
        value: String(profileSummary?.breathHoldCount ?? 0),
        detail: 'sessions',
        icon: 'timer',
      },
      {
        label: 'Active days',
        value: String(profileSummary?.activeDays ?? 0),
        detail: 'tracked',
        icon: 'sparkle',
      },
    ],
    [profileSummary],
  );

  const handleSignOut = () => {
    if (signingOut) return;
    trackProfileAction('sign_out_prompt_opened');
    Alert.alert(
      'Sign out?',
      'You can sign back in any time.',
      [
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
      ],
    );
  };

  const handleChangePhoto = async () => {
    if (uploadAvatarMutation.isPending) {
      return;
    }

    if (user == null) {
      Alert.alert('Sign in required', 'Sign in before changing your profile photo.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo access in Settings to choose a profile photo.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || result.assets[0]?.uri == null) {
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(result.assets[0].uri);
      trackProfileAction('profile_photo_updated');
    } catch (err) {
      trackProfileAction('profile_photo_update_failed', {
        error_message: err instanceof Error ? err.message : 'unknown_error',
      });
      Alert.alert(
        'Photo update failed',
        err instanceof Error ? err.message : 'Please try again.',
      );
    }
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
          <HomeTopMesh />
          <AppTopBar streak={profileSummary?.currentStreak ?? 0} />

          <View style={styles.heroCardWrap}>
            <ProfileIdentityCard
              displayName={displayName}
              avatarLabel={avatarLabel}
              avatarUrl={profileSummary?.profile?.avatarUrl}
              onChangePhoto={handleChangePhoto}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="All-time statistics" />
          <View style={styles.sectionBody}>
            <ProfileStatsGrid hero={profileHero} secondary={profileSecondary} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Consistency" />
          <View style={styles.sectionBody}>
            <ProfileCompletionCalendarCard completedDays={profileSummary?.completedDays ?? []} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Heart health" />
          <View style={styles.sectionBody}>
            <ProfileBreathHoldTrendCard data={profileSummary?.breathHoldTrend ?? []} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Account" />
          <View style={styles.sectionBody}>
            <ProfileAccountCard
              email={user?.email ?? undefined}
              hapticsEnabled={hapticsEnabled}
              onToggleHaptics={(enabled) => {
                setHapticsEnabled(enabled);
                trackProfileAction('haptics_toggled', { enabled });
              }}
              onOpenNotifications={() => {
                trackProfileAction('notifications_opened');
                void Linking.openSettings();
              }}
              onOpenPrivacyPolicy={() => {
                trackProfileAction('privacy_policy_opened');
                void Linking.openURL('https://www.tryazora.app/privacy');
              }}
              onOpenTerms={() => {
                trackProfileAction('terms_opened');
                void Linking.openURL('https://www.tryazora.app/terms');
              }}
              onManageSubscription={() => {
                void handleManageSubscription();
              }}
              onSignOut={handleSignOut}
              onDeleteAccount={handleDeleteAccount}
            />
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: spacing['5xl'],
  },
  topSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  heroCardWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.lg,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionBody: {
    marginTop: spacing.xs,
  },
});
