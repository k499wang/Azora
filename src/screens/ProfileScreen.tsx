import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import AmbientBackground from '../components/common/AmbientBackground';
import AppTopBar from '../components/common/AppTopBar';
import BrandLockup from '../components/common/BrandLockup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SectionHeader from '../components/common/SectionHeader';
import ProfileDisplayNameEditorDialog from '../components/profile/ProfileDisplayNameEditorDialog';
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard';
import ProfileCompletionCalendarCard from '../components/profile/ProfileCompletionCalendarCard';
import { useAuthStore } from '../stores/authStore';
import type { ProfileScreenProps } from '../app/navigation';
import type { ProfileSummary } from '../services/profile/profileSummaryService';
import { trackProfileAction } from '../services/analytics/tracking';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useUploadProfileAvatarMutation } from '../queries/profile/useUploadProfileAvatarMutation';
import { useUpdateProfileDisplayNameMutation } from '../queries/profile/useUpdateProfileDisplayNameMutation';

function getFallbackDisplayName(_email: string | undefined): string {
  return '—';
}

function getIdentitySubtitle(summary: ProfileSummary | undefined): string | null {
  if (summary == null) {
    return null;
  }

  if (summary.currentStreak > 0) {
    return `${summary.currentStreak}-day streak`;
  }

  if (summary.breathHoldCount > 0) {
    return `${summary.breathHoldCount} breath ${summary.breathHoldCount === 1 ? 'hold' : 'holds'}`;
  }

  return 'New here';
}

function getAvatarLabel(displayName: string): string {
  const words = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0 || (words.length === 1 && words[0] === '—')) {
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
  const avatarUrl = profileSummary?.profile?.avatarUrl;
  const subtitle = getIdentitySubtitle(profileSummary);

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
          <View style={styles.heroBackdrop} pointerEvents="none">
            <MaskedView
              style={StyleSheet.absoluteFill}
              maskElement={(
                <LinearGradient
                  colors={['black', 'black', 'transparent']}
                  locations={[0, 0.65, 1]}
                  style={StyleSheet.absoluteFill}
                />
              )}
            >
              <Image
                source={require('../../assets/profile-hero-background.png')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
              />
            </MaskedView>
          </View>
          <AppTopBar
            leftSlot={<BrandLockup />}
            rightSlot={
              <Pressable
                hitSlop={12}
                onPress={() => {
                  trackProfileAction('settings_opened');
                  navigation.navigate('Settings');
                }}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <MaterialCommunityIcons name="cog-outline" size={28} color={colors.text.tertiary} />
              </Pressable>
            }
          />

          <View style={styles.heroCardWrap}>
            <ProfileIdentityCard
              displayName={displayName}
              avatarLabel={avatarLabel}
              avatarUrl={avatarUrl}
              subtitle={subtitle}
              isUploading={uploadAvatarMutation.isPending}
              onChangePhoto={handleChangePhoto}
              onEditDisplayName={() => {
                trackProfileAction('profile_name_edit_opened');
                setEditingDisplayName(true);
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Consistency" />
          <View style={styles.sectionBody}>
            <ProfileCompletionCalendarCard completedDays={profileSummary?.completedDays ?? []} />
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
    position: 'relative',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  heroBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 1.1,
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
