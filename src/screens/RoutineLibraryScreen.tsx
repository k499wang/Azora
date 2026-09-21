import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ExploreScreenProps } from '../app/navigation';
import CollapsingTitleBar, { useCollapsingContentInset, useCollapsingTitle } from '../components/common/CollapsingTitleBar';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import Skeleton from '../components/common/Skeleton';
import TabTitleRow from '../components/common/TabTitleRow';
import HouseCleaningPdfPreviewSheet from '../components/explore/HouseCleaningPdfPreviewSheet';
import MoodGrid from '../components/explore/MoodGrid';
import ScreenContent from '../components/common/ScreenContent';
import { loadRoutineLibraryImages } from '../services/images/routineLibraryImageCache';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';

const TAB_BAR_HEIGHT = 49;
const SEARCH_BUTTON_SIZE = 46;

export default function RoutineLibraryScreen({ navigation }: ExploreScreenProps) {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const [coversReady, setCoversReady] = useState(false);
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

  if (!coversReady) {
    return (
      <View style={styles.screen}>
        <View style={[styles.loadingContent, { paddingTop: contentInset }]}>
          <ScreenContent width="grouped">
            <View style={styles.loadingHeader}>
              <Skeleton width={108} height={32} radius={10} />
              <Skeleton width={SEARCH_BUTTON_SIZE} height={SEARCH_BUTTON_SIZE} radius={SEARCH_BUTTON_SIZE / 2} />
            </View>
          </ScreenContent>
          <View style={styles.loadingShelf}>
            <Skeleton width={164} height={20} radius={8} />
            <View style={styles.loadingCards}>
              <Skeleton width={176} height={240} radius={22} />
              <Skeleton width={176} height={240} radius={22} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return <View style={styles.screen}>
    <Animated.ScrollView contentContainerStyle={[styles.content, { paddingTop: contentInset, paddingBottom: tabBarHeight + spacing.xl }]} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      <ScreenContent width="grouped">
        <TabTitleRow
          title="Explore"
          action={
            <GlassIconButton
            accessibilityLabel="Search exercises"
            size={SEARCH_BUTTON_SIZE}
            variant="regular"
            onPress={() => navigation.navigate('ExerciseSearch')}
          >
            <Icon name="search" size={24} color={colors.text.secondary} />
            </GlassIconButton>
          }
        />
      </ScreenContent>
      <MoodGrid
        onOpenRoutine={(entry) => navigation.navigate('RoutineLibraryDetail', { libraryId: entry.id })}
        onPreviewHomeCareGuide={() => setPdfPreviewVisible(true)}
      />
    </Animated.ScrollView>
    <CollapsingTitleBar title="Explore" scrollY={scrollY} />
    <HouseCleaningPdfPreviewSheet visible={pdfPreviewVisible} onClose={() => setPdfPreviewVisible(false)} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  content: {},
  loadingContent: { gap: spacing.xl },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingShelf: { gap: spacing.md, paddingLeft: spacing.lg },
  loadingCards: { flexDirection: 'row', gap: spacing.md },
});
