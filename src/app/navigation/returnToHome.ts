import type { RootStackNavigationProp } from './types';

type HomeNavigation = Pick<RootStackNavigationProp, 'navigate'>;

/** Return to the existing tab navigator instead of stacking another copy. */
export function returnToHome(navigation: HomeNavigation): void {
  navigation.navigate('MainTabs', { screen: 'Home' }, { pop: true });
}
