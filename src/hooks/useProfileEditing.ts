import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { trackProfileAction } from '../services/analytics/tracking';
import { useUploadProfileAvatarMutation } from '../queries/profile/useUploadProfileAvatarMutation';
import { useUpdateProfileDisplayNameMutation } from '../queries/profile/useUpdateProfileDisplayNameMutation';

export function useProfileEditing(userId: string | null) {
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const uploadAvatarMutation = useUploadProfileAvatarMutation(userId);
  const updateDisplayNameMutation = useUpdateProfileDisplayNameMutation(userId);

  const handleChangePhoto = async () => {
    if (uploadAvatarMutation.isPending) {
      return;
    }

    if (userId == null) {
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

    if (userId == null) {
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

  return {
    editingDisplayName,
    isUploading: uploadAvatarMutation.isPending,
    isSaving: updateDisplayNameMutation.isPending,
    changePhoto: handleChangePhoto,
    saveDisplayName: handleSaveDisplayName,
    editDisplayName: () => {
      trackProfileAction('profile_name_edit_opened');
      setEditingDisplayName(true);
    },
    cancelEditingDisplayName: () => setEditingDisplayName(false),
  };
}
