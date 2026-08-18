import { useContext, useEffect, type DependencyList } from 'react';
import { AppState } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { runWhileVisible } from '../lib/ui/runWhileVisible';

/**
 * `useEffect` for work that must not run behind the user's back: looping
 * animations, ticking clocks, polling.
 *
 * A screen that is covered is still mounted. `freezeOnBlur` stops it
 * re-rendering and native tabs do not even do that, but neither stops a
 * Reanimated loop, an `Animated.loop`, or a timer — those keep taking frames
 * from whatever the user is actually looking at, which is how a breathing
 * animation gets choppier the more of the app has been opened in one launch.
 *
 * `start` runs on focus and on returning to the foreground; its cleanup runs on
 * blur, on backgrounding, and on unmount, so nothing survives a screen the user
 * has left. Outside a navigator — the onboarding overlay draws there — there is
 * no focus to read and only the foreground gate applies.
 */
export function useWhileVisible(start: () => () => void, deps: DependencyList) {
  const navigation = useContext(NavigationContext);

  useEffect(
    () =>
      runWhileVisible(start, {
        isVisible: () =>
          (navigation?.isFocused() ?? true) && AppState.currentState === 'active',
        subscribe: (onChange) => {
          const unsubscribeFocus = navigation?.addListener('focus', onChange);
          const unsubscribeBlur = navigation?.addListener('blur', onChange);
          const appState = AppState.addEventListener('change', onChange);

          return () => {
            unsubscribeFocus?.();
            unsubscribeBlur?.();
            appState.remove();
          };
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, ...deps],
  );
}
