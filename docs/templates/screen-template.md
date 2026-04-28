# Screen Template

Use this for screens that mostly compose sections, wire navigation, and call hooks or stores.

Best fit:

- registered navigation screens
- layout-heavy pages
- screens that should stay thin

Modeled on:

- `src/screens/HomeScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/HeartRateScreen.tsx`

```tsx
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing, padding } from '../theme/spacing';
import type { SCREEN_NAME_HEREScreenProps } from '../app/navigation';

export default function SCREEN_NAME_HERE(_: SCREEN_NAME_HEREScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          {/* Top visuals, page header, or hero section */}
        </View>

        <View style={styles.section}>
          {/* Main content section */}
        </View>

        <View style={styles.section}>
          {/* Additional section */}
        </View>
      </ScrollView>
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
  },
  content: {
    paddingBottom: spacing['5xl'],
  },
  topSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.md,
  },
});
```

## Notes

- Add route types in `src/app/navigation/types.ts` before creating the screen.
- Keep heavy workflow logic in a hook if the screen starts owning timers, permissions, or state transitions.
- Prefer passing explicit props into feature components instead of reading from services directly inside child components.

## Variants

If the screen is modal or flow-oriented:

- accept `navigation` and `route`
- use `useCallback` for close/submit handlers
- keep the actual flow UI in a component under `src/components/` when it is reusable or multi-step
