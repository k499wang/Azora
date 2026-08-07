import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/common/Text';
import AppTopBar from '../components/common/AppTopBar';
import SectionHeader from '../components/common/SectionHeader';
import { DAYS, DecorationTile } from '../features/room/RoomScene';
import { toPicks } from '../features/room/roomPicks';
import { useCurrentRoomQuery } from '../queries/room/useCurrentRoomQuery';
import { usePlaceDecorationMutation } from '../queries/room/usePlaceDecorationMutation';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useAuthStore } from '../stores/authStore';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import type { RoomDecorateScreenProps } from '../app/navigation';

const TILE_WIDTH = 96;

export default function RoomDecorateScreen(_: RoomDecorateScreenProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const currentRoom = useCurrentRoomQuery(userId).data;
  const placeDecoration = usePlaceDecorationMutation(userId);
  const todayLocalDate = useTodayLocalDate();
  const picks = toPicks(currentRoom?.room?.decorations ?? []);

  return (
    <View style={styles.screen}>
      <AppTopBar title="Decorate" showAvatar={false} showStreak={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {DAYS.map((day) => (
          <View key={day.key} style={styles.section}>
            <SectionHeader title={day.title} />
            <Text style={styles.note}>{day.note}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tileRow}
            >
              {day.options.map((option) => {
                const selected = picks[day.key] === option.id;

                return (
                  <Pressable
                    key={option.id}
                    style={[styles.tile, selected && styles.tileSelected]}
                    onPress={() =>
                      placeDecoration.mutate({
                        slot: day.key,
                        optionId: option.id,
                        earnedLocalDate: todayLocalDate,
                      })
                    }
                  >
                    <DecorationTile
                      day={day.key}
                      option={option.id}
                      width={TILE_WIDTH}
                    />
                    <Text
                      style={[
                        styles.tileLabel,
                        selected && styles.tileLabelSelected,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingBottom: spacing['7xl'],
    gap: margin.sectionGap,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.xs,
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  tileRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tile: {
    ...card.base,
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  tileSelected: {
    backgroundColor: colors.primary.blue100,
  },
  tileLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    width: TILE_WIDTH,
    textAlign: 'center',
  },
  tileLabelSelected: {
    color: colors.primary.blue700,
  },
});
