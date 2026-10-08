import { Asset } from 'expo-asset';
import { NativeModules, Platform } from 'react-native';

export interface CompletionAudioNative {
  prepare(ownerId: string, uri: string): Promise<void>;
  restart(ownerId: string, volume: number): Promise<void>;
  /** Optional until the installed iOS binary includes scheduled playback. */
  schedule?(ownerId: string, volume: number, targetTimeMs: number): Promise<void>;
  stop(ownerId: string): Promise<void>;
  release(ownerId: string): Promise<void>;
}

// Module availability is fixed for the lifetime of this app binary.
export const completionAudioNative: CompletionAudioNative | null =
  Platform.OS === 'ios' ? NativeModules.CompletionAudio ?? null : null;

export async function loadCompletionAudioUri(source: number): Promise<string> {
  const asset = Asset.fromModule(source);
  await asset.downloadAsync();
  if (asset.localUri == null) throw new Error('Completion audio has no local file');
  return asset.localUri;
}
