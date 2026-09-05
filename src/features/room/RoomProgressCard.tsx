import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ProgressBar from '../../components/common/ProgressBar';
import ChunkyButton, {
  CHUNKY_TONE,
  CHUNKY_TONE_AMBER,
} from '../../components/common/ChunkyButton';
import { DAILIES_PER_DAY } from '../../lib/dailies';
import {
  ROOM_SLOT_COUNT,
  type RoomProgress,
} from '../../lib/room/roomProgress';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { MainTabNavigationProp } from '../../app/navigation';
import type { DailiesCompletion } from '../../hooks/useDailiesCompletion';

/** deep enough to carry the count inside it rather than beside it */
const BAR_HEIGHT = 20;
/**
 * One icon for the card, standing beside both rows rather than on the title's
 * line — the title and the bar are the same statement, so they share a margin
 * and the icon marks the pair.
 */
const HEADLINE_ICON_SIZE = 44;
/** Shorter than a screen's primary — this one sits inside a card. */
const CTA_MIN_HEIGHT = 48;

export type RoomCardTone = 'waiting' | 'ready' | 'done';

/**
 * Colour is the card's only state signal, so it says the one thing the user
 * needs: amber means something is waiting for them. Blue and green are both
 * passive — without the third tone the only state with a button looked like the
 * state with nothing to do.
 */
const TONE_STYLE: Record<
  RoomCardTone,
  {
    accent: string;
    track: string;
    /** the count riding in the bar: legible on the track and on the fill */
    countInk: string;
    cta: typeof CHUNKY_TONE;
  }
> = {
  waiting: {
    // The card is a dark scrim, so the sky tone is taken a step lighter than
    // `base` — the deep blue disappears into it.
    accent: colors.playful.sky.mid,
    track: colors.playful.sky.soft,
    countInk: colors.playful.sky.ink,
    cta: CHUNKY_TONE,
  },
  ready: {
    accent: colors.playful.amber.base,
    track: colors.playful.amber.soft,
    countInk: colors.playful.amber.ink,
    cta: CHUNKY_TONE_AMBER,
  },
  done: {
    accent: colors.success[500],
    track: colors.success[100],
    countInk: colors.success[700],
    cta: CHUNKY_TONE,
  },
};

/**
 * Where the room loop is, and the way back into it.
 *
 * Every other route into decorating is a one-shot: the post-session sheet, and
 * the screen that opens the next floor after the seventh piece lands. Closing
 * either one — or the app — used to leave a claimable piece, or a finished room
 * waiting to roll over, with nothing anywhere that led back to it. This is the
 * standing entry point, so no state of the loop is ever unreachable.
 */
interface RoomProgressCardProps {
  progress: Pick<
    RoomProgress,
    'isComplete' | 'canClaim' | 'claimedToday' | 'placedCount'
  >;
  dailies: Pick<
    DailiesCompletion,
    'guidedCompleted' | 'handPickedCompleted' | 'breathHoldCompleted'
  >;
  isLoading: boolean;
}

export default function RoomProgressCard({
  progress,
  dailies,
  isLoading,
}: RoomProgressCardProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  // Deliberately not gated on an existing room: the first `rooms` row is only
  // written when the first piece is placed, so requiring one hid this card from
  // exactly the users who have never been through the loop.
  if (isLoading) {
    return null;
  }

  const view = describeRoomCard({
    isComplete: progress.isComplete,
    canClaim: progress.canClaim,
    claimedToday: progress.claimedToday,
    dailiesDoneCount: [
      dailies.guidedCompleted,
      dailies.handPickedCompleted,
      dailies.breathHoldCompleted,
    ].filter(Boolean).length,
    placedCount: progress.placedCount,
  });

  return (
    <RoomProgressCardView
      view={view}
      onAction={(route) => navigation.navigate(route)}
    />
  );
}

/**
 * The card with its state handed to it, so the dev lab can show every state at
 * once without arranging a week of real progress.
 */
export function RoomProgressCardView({
  view,
  onAction,
}: {
  view: RoomCardView;
  onAction: (route: RoomCardRoute) => void;
}) {
  const action = view.action;
  const tone = TONE_STYLE[view.tone];

  return (
    <View
      style={[styles.card, view.tone !== 'done' && styles.cardShadow]}
    >
      <View style={styles.headline}>
        <Icon name="room-hex" size={HEADLINE_ICON_SIZE} color={tone.accent} />
        <View style={styles.headlineCopy}>
          <Text style={styles.title}>{view.title}</Text>
          <ProgressBar
            progress={view.done / view.total}
            height={BAR_HEIGHT}
            trackColor={tone.track}
            fillColor={tone.accent}
          >
            <Text style={[styles.count, { color: tone.countInk }]}>
              {view.done} / {view.total}
            </Text>
          </ProgressBar>
        </View>
      </View>

      {view.note == null ? null : (
        <Text style={[styles.note, styles.noteText]}>{view.note}</Text>
      )}

      {action == null ? null : (
        <ChunkyButton
          label={action.label}
          shape="card"
          tone={tone.cta}
          minHeight={CTA_MIN_HEIGHT}
          trailingIcon={
            <Icon name="chevron-right" size={16} color={colors.text.inverse} />
          }
          onPress={() => onAction(action.route)}
        />
      )}
    </View>
  );
}

export type RoomCardRoute = 'RoomDecorate' | 'NextRoom';

export interface RoomCardView {
  title: string;
  /** the line under the title, when the title alone does not say the rule */
  note?: string;
  /** drives the icon, the bar and the button */
  tone: RoomCardTone;
  /** the bar counts whatever the title is about, never something else */
  done: number;
  total: number;
  action: { label: string; route: RoomCardRoute } | null;
}

/**
 * The card speaks in terms of today's dailies, because that is the thing the
 * user controls — the floor number is bookkeeping. A button appears only when
 * there is something waiting that they cannot otherwise reach.
 */
export function describeRoomCard({
  isComplete,
  canClaim,
  claimedToday,
  dailiesDoneCount,
  placedCount,
}: {
  isComplete: boolean;
  canClaim: boolean;
  claimedToday: boolean;
  dailiesDoneCount: number;
  placedCount: number;
}): RoomCardView {
  const room = { done: placedCount, total: ROOM_SLOT_COUNT };
  // A full room earns nothing until the next floor is opened, and opening it is
  // otherwise only offered once, right after the seventh piece lands. Anyone who
  // missed that screen would be stuck here forever.
  if (isComplete) {
    return {
      title: 'This room is finished',
      note: 'Pick a new room to keep going.',
      tone: 'ready',
      ...room,
      action: { label: 'Pick a new room', route: 'NextRoom' },
    };
  }

  if (canClaim) {
    return {
      title: 'Your decoration is ready',
      note: 'Seven decorations finish a room.',
      tone: 'ready',
      ...room,
      action: { label: 'Place it in your room', route: 'RoomDecorate' },
    };
  }

  if (claimedToday) {
    // Today is what this state is about, so the bar stays on today rather than
    // dropping back to a room count that reads as progress lost.
    return {
      title: 'All set for today!',
      tone: 'done',
      done: DAILIES_PER_DAY,
      total: DAILIES_PER_DAY,
      action: null,
    };
  }

  // Still working through today. The title and the 1 / 3 beside it already say
  // the rule, so the line under them stays empty.
  //
  // The bar counts the three dailies, because that is what the title asks for —
  // showing room pieces here read as "finish today's dailies — 1 / 7", which
  // asks for four days that do not exist.
  //
  // Finishing them can only land in `canClaim` above, never here: that flag is
  // built from the same `allCompleted` this branch would test.
  return {
    title: "Finish today's dailies",
    tone: 'waiting',
    done: dailiesDoneCount,
    total: DAILIES_PER_DAY,
    action: null,
  };
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    backgroundColor: colors.background.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardShadow: card.shadow,
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headlineCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title3,
    fontSize: 19,
    lineHeight: 26,
    flex: 1,
    color: colors.text.primary,
  },
  note: {
    marginTop: -spacing.xs,
  },
  noteText: {
    ...typography.label.detail,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  // In the bar, in the tone's own ink — dark enough to hold on the pale track
  // and on the fill that passes under it as the bar grows.
  count: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
  },
});
