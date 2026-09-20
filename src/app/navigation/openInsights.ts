import type { RootStackNavigationProp } from './types';

/** Select the existing Insights tab even when opened from a pushed screen. */
export function openInsights(
  navigation: Pick<RootStackNavigationProp, 'navigate'>,
): void {
  navigation.navigate('MainTabs', { screen: 'Insights' }, { pop: true });
}
