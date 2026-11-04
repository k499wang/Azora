import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { padding, spacing } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';

interface ExploreShelfProps {
  title: string;
  children: ReactNode;
  onSeeAll?: () => void;
}

/** A consistently spaced title and horizontal rail on the Explore screen. */
export default function ExploreShelf({ title, children, onSeeAll }: ExploreShelfProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SectionHeader
          title={title}
          titleNumberOfLines={2}
          right={onSeeAll == null ? undefined : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`All ${title}`}
              hitSlop={spacing.sm}
              onPress={() => {
                triggerTapHaptic();
                onSeeAll();
              }}
              style={({ pressed }) => [styles.seeAll, pressed && pressable.subtle]}
            >
              <Text style={styles.seeAllLabel}>All</Text>
              <Icon bold name="chevron-right" size={20} color={colors.text.brand} />
            </Pressable>
          )}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelf}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllLabel: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  shelf: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
});
