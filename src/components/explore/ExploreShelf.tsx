import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { padding, spacing } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';

interface ExploreShelfProps {
  title: string;
  children: ReactNode;
}

/** A consistently spaced title and horizontal rail on the Explore screen. */
export default function ExploreShelf({ title, children }: ExploreShelfProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SectionHeader title={title} />
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
  shelf: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
});
