import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from '../components/common/SectionHeader';
import ProfileDisplayNameEditorDialog from '../components/profile/ProfileDisplayNameEditorDialog';
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard';
import ProfileCompletionCalendarCard from '../components/profile/ProfileCompletionCalendarCard';
import ProfileLifetimeStatsRow from '../components/profile/ProfileLifetimeStatsRow';
import { useAuthStore } from '../stores/authStore';
import type { ProfileScreenProps } from '../app/navigation';
import { trackProfileAction } from '../services/analytics/tracking';
import { triggerTapHaptic } from '../native/tapHaptics';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useUploadProfileAvatarMutation } from '../queries/profile/useUploadProfileAvatarMutation';
import { useUpdateProfileDisplayNameMutation } from '../queries/profile/useUpdateProfileDisplayNameMutation';
import ScreenContent from '../components/common/ScreenContent';
import { useDashboardLayout } from '../hooks/useDashboardLayout';

// The Pro button is the tallest control either peer header can carry, so both
// headers reserve its height and the cards below them start on the same line.
const DASHBOARD_HEADER_HEIGHT =
  typography.label.small.lineHeight + spacing.sm * 2;

function getFallbackDisplayName(_email: string | undefined): string {
  return '—';
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const dashboardLayout = useDashboardLayout();
  const uploadAvatarMutation = useUploadProfileAvatarMutation(user?.id ?? null);
  const updateDisplayNameMutation = useUpdateProfileDisplayNameMutation(user?.id ?? null);

  const profileSummary = profileSummaryQuery.data;
  const displayName =
    profileSummary?.profile?.displayName ?? getFallbackDisplayName(user?.email);
  const avatarUrl = profileSummary?.profile?.avatarUrl;
  const headerSlot = dashboardLayout.hasColumns
    ? styles.sectionHeaderWide
    : undefined;

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <ScreenContent width="dashboard">
          <AppTopBar
            showAvatar={false}
            rightSlot={<View style={styles.topBarActionPlaceholder} />}
          />

          <View style={styles.heroCardWrap}>
            <ProfileIdentityCard
              displayName={displayName}
              avatarUrl={avatarUrl}
              isUploading={uploadAvatarMutation.isPending}
              onChangePhoto={handleChangePhoto}
              onEditDisplayName={() => {
                trackProfileAction('profile_name_edit_opened');
                setEditingDisplayName(true);
              }}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionBody}>
              <ProfileLifetimeStatsRow
                totalBreaths={profileSummary?.totalBreaths ?? 0}
                totalSessions={profileSummary?.totalSessions ?? 0}
                totalHoldSeconds={profileSummary?.totalHoldSeconds ?? 0}
              />
            </View>
          </View>

          <View
            style={dashboardLayout.hasColumns ? styles.dashboardSectionsWide : undefined}
          >
            <View
              style={[
                styles.section,
                dashboardLayout.hasColumns && styles.dashboardSectionWide,
              ]}
            >
              <View style={headerSlot}>
                <SectionHeader
                  title="Consistency"
                  right={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open your history"
                      hitSlop={spacing.sm}
                      onPress={() => {
                        triggerTapHaptic();
                        navigation.navigate('History');
                      }}
                      style={styles.sectionLink}
                    >
                      <Text style={styles.sectionLinkText}>See all</Text>
                      <Icon
                        name="chevron-right"
                        size={16}
                        color={colors.text.brand}
                      />
                    </Pressable>
                  }
                />
              </View>
              <View
                style={[
                  styles.sectionBody,
                  dashboardLayout.hasColumns && styles.sectionBodyFill,
                ]}
              >
                <ProfileCompletionCalendarCard
                  completedDays={profileSummary?.completedDays ?? []}
                  fill={dashboardLayout.hasColumns}
                />
              </View>
            </View>
          </View>
        </ScreenContent>
      </ScrollView>

      <GlassIconButton
        accessibilityLabel="Open settings"
        size={48}
        style={[
          styles.stickyAction,
          {
            top: insets.top + spacing.xs,
            right: dashboardLayout.actionInset,
          },
        ]}
        variant="regular"
        onPress={() => {
          triggerTapHaptic();
          trackProfileAction('settings_opened');
          navigation.navigate('Settings');
        }}
      >
        <Ionicons
          name="settings-outline"
          size={26}
          color={colors.text.secondary}
        />
      </GlassIconButton>

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
    backgroundColor: colors.background.canvas,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: spacing['7xl'] + spacing.xl,
  },
  topBarActionPlaceholder: {
    width: 48,
    height: 48,
  },
  stickyAction: {
    position: 'absolute',
    zIndex: 1,
    elevation: 1,
  },
  heroCardWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.lg,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.lg,
  },
  // Peer sections, so they stretch to the taller of the two and their cards
  // fill that height rather than one card ending halfway up the other.
  dashboardSectionsWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  dashboardSectionWide: {
    flex: 1,
  },
  sectionHeaderWide: {
    minHeight: DASHBOARD_HEADER_HEIGHT,
    justifyContent: 'center',
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLinkText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  // The section gap above already spaces the body below its header; the
  // wrapper stays only so headerless sections keep the same structure.
  sectionBody: {},
  sectionBodyFill: {
    flex: 1,
  },
});
