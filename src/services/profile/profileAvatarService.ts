import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { requireSupabaseClient } from '../supabase';

const AVATAR_BUCKET = 'avatars';
const AVATAR_SIZE = 512;

export async function uploadProfileAvatar(
  userId: string,
  imageUri: string,
): Promise<string> {
  const supabase = requireSupabaseClient();
  const processedImage = await manipulateAsync(
    imageUri,
    [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
    {
      compress: 0.86,
      format: SaveFormat.JPEG,
    },
  );
  const response = await fetch(processedImage.uri);
  const body = await response.arrayBuffer();
  const version = Date.now();
  const path = `${userId}/profile.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, body, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError != null) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${version}`;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', userId);

  if (updateError != null) {
    throw updateError;
  }

  return avatarUrl;
}
