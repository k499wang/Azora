import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import ProfileDisplayNameEditorDialog from '../components/profile/ProfileDisplayNameEditorDialog';
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard';
import ProfileStatsGrid, {
  type ProfileStatBadge,
  type ProfileStatHero,
} from '../components/profile/ProfileStatsGrid';
import ProfileCompletionCalendarCard from '../components/profile/ProfileCompletionCalendarCard';
import ProfileBreathHoldTrendCard from '../components/profile/ProfileBreathHoldTrendCard';
import { useAuthStore } from '../stores/authStore';
import type { ProfileScreenProps } from '../app/navigation';
import { trackProfileAction } from '../services/analytics/tracking';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { formatProfileHoldTime } from '../services/profile/profileSummaryService';
import { useUploadProfileAvatarMutation } from '../queries/profile/useUploadProfileAvatarMutation';
import { useUpdateProfileDisplayNameMutation } from '../queries/profile/useUpdateProfileDisplayNameMutation';

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

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const uploadAvatarMutation = useUploadProfileAvatarMutation(user?.id ?? null);
  const updateDisplayNameMutation = useUpdateProfileDisplayNameMutation(user?.id ?? null);

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

  const handleUpdateDisplayName = async (nextDisplayName: string) => {
    const trimmedDisplayName = nextDisplayName.trim();

    if (user == null) {
      Alert.alert('Sign in required', 'Sign in before changing your profile name.');
      throw new Error('Cannot update a profile name without a signed-in user.');
    }

    if (trimmedDisplayName.length === 0) {
      Alert.alert('Name required', 'Enter a display name before saving.');
      throw new Error('Display name is required.');
    }

    try {
      await updateDisplayNameMutation.mutateAsync(trimmedDisplayName);
      trackProfileAction('profile_name_updated');
    } catch (err) {
      trackProfileAction('profile_name_update_failed', {
        error_message: err instanceof Error ? err.message : 'unknown_error',
      });
      Alert.alert(
        'Name update failed',
        err instanceof Error ? err.message : 'Please try again.',
      );
      throw err;
    }
  };

  const handleSaveDisplayName = async (nextDisplayName: string) => {
    await handleUpdateDisplayName(nextDisplayName);
    setEditingDisplayName(false);
  };

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <AppTopBar
            showStreak={false}
            rightSlot={
              <Pressable
                onPress={() => {
                  trackProfileAction('settings_opened');
                  navigation.navigate('Settings');
                }}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.settingsButton,
                  pressed && styles.settingsButtonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={26}
                  color={colors.text.primary}
                />
              </Pressable>
            }
          />

          <View style={styles.heroCardWrap}>
            <ProfileIdentityCard
              displayName={displayName}
              avatarLabel={avatarLabel}
              avatarUrl={profileSummary?.profile?.avatarUrl}
              onChangePhoto={handleChangePhoto}
              onEditDisplayName={() => {
                trackProfileAction('profile_name_edit_opened');
                setEditingDisplayName(true);
              }}
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
          <SectionHeader title="Breath Statistics" />
          <View style={styles.sectionBody}>
            <ProfileBreathHoldTrendCard data={profileSummary?.breathHoldTrend ?? []} />
          </View>
        </View>

      </ScrollView>

      <ProfileDisplayNameEditorDialog
        visible={editingDisplayName}
        displayName={displayName}
        isSaving={updateDisplayNameMutation.isPending}
        onCancel={() => {
          setEditingDisplayName(false);
        }}
        onSave={handleSaveDisplayName}
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
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: spacing['7xl'] + spacing.xl,
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
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonPressed: {
    opacity: 0.6,
  },
});
