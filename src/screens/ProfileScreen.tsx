import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
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

const PROFILE_HERO: ProfileStatHero = {
  label: 'Longest hold',
  value: '2:18',
  detail: 'Personal best · up 12s this month',
  icon: 'breath-hold',
  trend: [72, 79, 77, 84, 89, 93, 98, 138],
};

const PROFILE_SECONDARY: ProfileStatBadge[] = [
  {
    label: 'Best streak',
    value: '19',
    detail: 'days',
    icon: 'streak',
  },
  {
    label: 'Breath holds',
    value: '47',
    detail: 'sessions',
    icon: 'timer',
  },
  {
    label: 'Active days',
    value: '22',
    detail: 'tracked',
    icon: 'sparkle',
  },
];

const BREATH_HOLD_TREND = [
  { label: '3', value: 72 },
  { label: '6', value: 79 },
  { label: '9', value: 77 },
  { label: '12', value: 84 },
  { label: '15', value: 89 },
  { label: '18', value: 93 },
  { label: '21', value: 98 },
  { label: '24', value: 104 },
];

const COMPLETED_DAYS = [2, 3, 5, 6, 8, 10, 11, 13, 15, 16, 18, 20, 21, 22, 23, 24, 25, 26];

export default function ProfileScreen(_: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [signingOut, setSigningOut] = useState(false);

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

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <HomeTopMesh />
          <AppTopBar />

          <View style={styles.heroCardWrap}>
            <ProfileIdentityCard
              displayName="Kevin Wong"
              avatarLabel="KW"
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="All-time statistics" />
          <View style={styles.sectionBody}>
            <ProfileStatsGrid hero={PROFILE_HERO} secondary={PROFILE_SECONDARY} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Consistency" />
          <View style={styles.sectionBody}>
            <ProfileCompletionCalendarCard completedDays={COMPLETED_DAYS} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Heart health" />
          <View style={styles.sectionBody}>
            <ProfileBreathHoldTrendCard data={BREATH_HOLD_TREND} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Account" />
          <View style={styles.sectionBody}>
            <ProfileAccountCard
              email={user?.email ?? undefined}
              onOpenNotifications={() => {
                trackProfileAction('notifications_opened');
                void Linking.openSettings();
              }}
              onOpenPrivacyPolicy={() => {
                trackProfileAction('privacy_policy_opened');
                void Linking.openURL('https://azora.app/privacy');
              }}
              onOpenTerms={() => {
                trackProfileAction('terms_opened');
                void Linking.openURL('https://azora.app/terms');
              }}
              onManageSubscription={() => {
                trackProfileAction('manage_subscription_opened');
                void Linking.openURL('https://apps.apple.com/account/subscriptions');
              }}
              onSignOut={handleSignOut}
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
