import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ExploreScreenProps } from '../app/navigation';
import CollapsingTitleBar, { useCollapsingContentInset, useCollapsingTitle } from '../components/common/CollapsingTitleBar';
import RoutineLibraryArt from '../components/explore/RoutineLibraryArt';
import HouseCleaningPdfPreviewSheet from '../components/explore/HouseCleaningPdfPreviewSheet';
import ScreenContent from '../components/common/ScreenContent';
import { Text } from '../components/common/Text';
import RoutineCategoryCard from '../features/selfCare/RoutineCategoryCard';
import { GOAL_SUGGESTION_CATEGORIES } from '../features/selfCare/goalSuggestions';
import { HOME_CARE_GUIDES, ROUTINE_TEMPLATES, type RoutineLibraryEntry } from '../data/routineLibrary';
import { triggerTapHaptic } from '../native/tapHaptics';
import { loadRoutineLibraryImages } from '../services/images/routineLibraryImageCache';
import { colors } from '../theme/colors';
import { pressable } from '../theme/pressable';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';

const TAB_BAR_HEIGHT = 49;

function TemplateCard({ entry, onPress }: { entry: RoutineLibraryEntry; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={entry.title} accessibilityHint="Opens this routine" onPress={() => { triggerTapHaptic(); onPress(); }} style={({ pressed }) => [styles.templateCard, pressed && pressable.subtle]}>
    {entry.kind === 'pdf' ? (
      <Image
        source={require('../../assets/routines/house-cleaning-preview.png')}
        contentFit="cover"
        style={styles.pdfThumbnail}
      />
    ) : <RoutineLibraryArt entry={entry} size="card" />}
    <View style={styles.cardCopy}>
      <Text style={styles.cardTitle} numberOfLines={2}>{entry.title}</Text>
      <Text style={styles.cardMetadata} numberOfLines={1}>
        {entry.kind === 'pdf' ? 'PDF · 10 pages' : entry.eyebrow}
      </Text>
    </View>
  </Pressable>;
}

export default function RoutineLibraryScreen({ navigation }: ExploreScreenProps) {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const [coversReady, setCoversReady] = useState(false);
  const open = (entry: RoutineLibraryEntry) => navigation.navigate('RoutineLibraryDetail', { libraryId: entry.id });
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  useEffect(() => {
    let active = true;
    void loadRoutineLibraryImages().finally(() => {
      if (active) setCoversReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!coversReady) return <View style={styles.screen} />;

  return <View style={styles.screen}>
    <Animated.ScrollView contentContainerStyle={[styles.content, { paddingTop: contentInset, paddingBottom: tabBarHeight + spacing.xl }]} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      <ScreenContent width="grouped">
        <View style={styles.titleRow}>
          <Text style={styles.title}>Explore</Text>
        </View>
      </ScreenContent>
      <View style={styles.firstSection}><ScreenContent width="grouped"><Text style={styles.sectionTitle}>Routine templates</Text></ScreenContent><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>{ROUTINE_TEMPLATES.map((entry) => <TemplateCard key={entry.id} entry={entry} onPress={() => open(entry)} />)}</ScrollView></View>
      <View style={styles.section}><ScreenContent width="grouped"><Text style={styles.sectionTitle}>Home-care guides</Text></ScreenContent><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>{HOME_CARE_GUIDES.map((entry) => <TemplateCard key={entry.id} entry={entry} onPress={() => setPdfPreviewVisible(true)} />)}</ScrollView></View>
      <View style={styles.section}>
        <ScreenContent width="grouped" style={styles.routinesHeader}>
          <Text style={styles.routinesTitle}>Routines</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore all routines"
            onPress={() => {
              triggerTapHaptic();
              navigation.navigate('RoutineBrowser');
            }}
          >
            <Text style={styles.exploreAll}>Explore all</Text>
          </Pressable>
        </ScreenContent>
        <ScreenContent width="grouped" style={styles.routineRows}>
          {GOAL_SUGGESTION_CATEGORIES.slice(0, 2).map((category) => (
            <RoutineCategoryCard
              key={category.id}
              category={category}
              variant="row"
              onPress={() => navigation.navigate('RoutineCategory', { categoryId: category.id })}
            />
          ))}
        </ScreenContent>
      </View>
    </Animated.ScrollView>
    <CollapsingTitleBar title="Explore" scrollY={scrollY} />
    <HouseCleaningPdfPreviewSheet visible={pdfPreviewVisible} onClose={() => setPdfPreviewVisible(false)} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas }, content: {},
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: padding.screen.horizontal, paddingBottom: spacing.xl },
  title: { ...typography.title.title2, fontFamily: fonts.semibold, color: colors.text.primary },
  firstSection: { gap: spacing.md }, section: { gap: spacing.md, marginTop: spacing['2xl'] }, sectionTitle: { ...typography.title.title3, fontFamily: fonts.semibold, color: colors.text.primary, paddingHorizontal: padding.screen.horizontal },
  routinesTitle: { ...typography.title.title3, fontFamily: fonts.semibold, color: colors.text.primary },
  routinesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: padding.screen.horizontal },
  exploreAll: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.text.brand },
  routineRows: { gap: spacing.sm, paddingHorizontal: padding.screen.horizontal },
  rail: { paddingHorizontal: padding.screen.horizontal, gap: spacing.md }, templateCard: { width: 164 },
  pdfThumbnail: { width: 164, height: 240, borderRadius: 22, backgroundColor: colors.background.card },
  cardCopy: { gap: 2, paddingTop: spacing.sm },
  cardTitle: { ...typography.body.large, fontFamily: fonts.semibold, color: colors.text.primary }, cardMetadata: { ...typography.label.medium, fontFamily: fonts.regular, color: colors.text.secondary },
});
