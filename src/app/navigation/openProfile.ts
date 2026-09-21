import type { RootStackNavigationProp } from './types';

/** Select the existing Profile tab even when opened from a pushed screen. */
export function openProfile(
  navigation: Pick<RootStackNavigationProp, 'navigate'>,
): void {
  navigation.navigate('MainTabs', { screen: 'Profile' }, { pop: true });
}
