import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CleanupRoomsScreenProps } from '../../app/navigation';
import AppTopBar from '../../components/common/AppTopBar';
import ScreenContent from '../../components/common/ScreenContent';
import ExploreActionCard from '../../components/explore/ExploreActionCard';
import { trackCleanupRoomPicked } from '../../services/analytics/tracking';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { cleanupMinutes } from './domain/cleanupPlan';
import { CLEANUP_ROOMS } from './domain/roomCleanupPlans';

const ROOM_HUES = {
  kitchen: colors.playful.amber,
  bathroom: colors.playful.sky,
  bedroom: colors.playful.violet,
  living: colors.playful.teal,
  laundry: colors.playful.coral,
  closet: colors.playful.blush,
  office: colors.playful.sky,
  entryway: colors.playful.amber,
  dining: colors.playful.violet,
  kids: colors.playful.teal,
} as const;

export default function CleanupRoomsScreen({ navigation }: CleanupRoomsScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <AppTopBar title="Clean a Room" showBack showAvatar={false} showStreak={false} />
      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped" style={styles.grid}>
          {CLEANUP_ROOMS.map((room) => (
            <View key={room.id} style={styles.tile}>
              <ExploreActionCard
                title={room.label}
                subtitle={`About ${cleanupMinutes(room.plan.objects)} min`}
                hue={ROOM_HUES[room.id]}
                illustration={room.icon}
                accessibilityLabel={room.label}
                accessibilityHint="Opens a ready-made cleaning plan for this room"
                onPress={() => {
                  trackCleanupRoomPicked({ room: room.id });
                  navigation.navigate('PhotoCleanup', { roomId: room.id });
                }}
              />
            </View>
          ))}
        </ScreenContent>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
  },
  tile: { width: '48%' },
});
