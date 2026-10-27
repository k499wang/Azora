import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { cleanupMinutes, type CleanupItem } from './domain/cleanupPlan';
import { cleanupItemIcon } from './domain/cleanupItemIcon';
import { MAX_ITEMS } from './domain/cleanupPlanEdits';

interface Props {
  photoUri: string | null;
  items: readonly CleanupItem[];
  safetyNote: string | null;
  onEditItem: (index: number) => void;
  onAddItem: () => void;
}

const ICON_SIZE = 40;
const EDIT_ICON_SIZE = 20;
const EDIT_BUTTON_SIZE = 36;

type IllustrationName = ComponentProps<typeof TaskIllustration>['name'];

/** The whole job at a glance — their photo, the time it should take, and every item in order — before the clock starts. */
export default function CleanupPlanOverview({ photoUri, items, safetyNote, onEditItem, onAddItem }: Props) {
  const total = cleanupMinutes(items);
  return (
    <View style={styles.overview}>
      {photoUri == null ? null : (
        <Image
          source={{ uri: photoUri }}
          style={styles.photo}
          contentFit="cover"
          transition={0}
          accessibilityLabel="Your photo"
        />
      )}
      <View style={styles.summary}>
        <Text style={styles.total}>About {total} min</Text>
        <Text style={styles.count}>
          {items.length} {items.length === 1 ? 'thing' : 'things'}, easiest first
        </Text>
      </View>
      {safetyNote == null ? null : <Text style={styles.safety}>{safetyNote}</Text>}
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={`${index}:${item.name}`} style={styles.item}>
            <TaskIllustration name={cleanupItemIcon(item.name) as IllustrationName} size={ICON_SIZE} />
            <Text style={styles.name}>{item.name}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name}`}
              hitSlop={spacing.sm}
              onPress={() => {
                triggerTapHaptic();
                onEditItem(index);
              }}
              style={({ pressed }) => [styles.edit, pressed && styles.editPressed]}
            >
              <Icon bold name="pencil" size={EDIT_ICON_SIZE} color={colors.text.secondary} />
            </Pressable>
            <View style={styles.minutesPill}>
              <Text style={styles.minutes}>{item.minutes} min</Text>
            </View>
          </View>
        ))}
        {items.length >= MAX_ITEMS ? null : (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              triggerTapHaptic();
              onAddItem();
            }}
            style={({ pressed }) => [styles.add, pressed && styles.itemPressed]}
          >
            <Icon name="plus" size={20} color={colors.primary.blue700} />
            <Text style={styles.addLabel}>Add something</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overview: { gap: spacing.lg },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[200],
  },
  summary: { gap: spacing.xs, alignItems: 'center' },
  total: { ...typography.title.title1, fontFamily: fonts.semibold, color: colors.text.primary },
  count: { ...typography.body.medium, color: colors.text.secondary, textAlign: 'center' },
  safety: { ...typography.body.small, color: colors.error[700], textAlign: 'center' },
  list: { gap: spacing.sm },
  item: {
    ...card.base,
    ...card.shadow,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemPressed: { transform: [{ scale: 0.98 }] },
  edit: {
    width: EDIT_BUTTON_SIZE,
    height: EDIT_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPressed: { opacity: 0.6 },
  name: { ...typography.body.large, fontFamily: fonts.semibold, color: colors.text.primary, flex: 1 },
  minutesPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.blue100,
  },
  minutes: { ...typography.label.medium, fontFamily: fonts.semibold, color: colors.primary.blue700 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary.blue200,
    paddingVertical: spacing.md,
  },
  addLabel: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.primary.blue700 },
});
