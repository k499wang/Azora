import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import ProgressBar from '../../components/common/ProgressBar';
import Skeleton from '../../components/common/Skeleton';
import ChunkyButton, {
  CHUNKY_TONE,
  CHUNKY_TONE_AMBER,
} from '../../components/common/ChunkyButton';
import {
  ROOM_SLOT_COUNT,
  type RoomProgress,
} from '../../lib/room/roomProgress';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { MainTabNavigationProp } from '../../app/navigation';
import type { DayCompletion } from './useDayCompletion';

/** deep enough to carry the count inside it rather than beside it */
const BAR_HEIGHT = 20;
/**
 * One icon for the card, standing beside both rows rather than on the title's
 * line — the title and the bar are the same statement, so they share a margin
 * and the icon marks the pair.
 */
const HEADLINE_ICON_SIZE = 44;
/** Shared with the loading placeholder so the two are exactly as tall. */
const TITLE_LINE_HEIGHT = 26;
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
  day: Pick<DayCompletion, 'done' | 'total'>;
  isLoading: boolean;
  /**
   * Opens the day's piece. Not a route: the reward stage is drawn over whatever
   * screen the user finished the day on, and this card's job is to make it
   * reachable again later — from the same Home whose room the stage grows out
   * of and returns to.
   */
  onClaim: () => void;
}

export default function RoomProgressCard({
  progress,
  day,
  isLoading,
  onClaim,
}: RoomProgressCardProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();

  // Deliberately not gated on an existing room: the first `rooms` row is only
  // written when the first piece is placed, so requiring one hid this card from
  // exactly the users who have never been through the loop.
  if (isLoading) {
    return <RoomProgressCardPlaceholder />;
  }

  const view = describeRoomCard({
    isComplete: progress.isComplete,
    canClaim: progress.canClaim,
    claimedToday: progress.claimedToday,
    doneCount: day.done,
    totalCount: day.total,
    placedCount: progress.placedCount,
  });

  return (
    <RoomProgressCardView
      view={view}
      onAction={(action) =>
        action.kind === 'claim' ? onClaim() : navigation.navigate(action.route)
      }
    />
  );
}

/**
 * The card's own shape while its room data loads.
 *
 * Returning null here left a card-sized hole that filled in whenever the query
 * landed, shoving today's list down the page — under the tour's cutout, and
 * under the user's thumb on the way to a daily. Built from the same pieces at
 * the same sizes as the waiting state, so nothing moves when the real one
 * replaces it.
 */
function RoomProgressCardPlaceholder() {
  return (
    <View
      accessibilityLabel="Loading room progress"
      style={[styles.card, styles.cardShadow]}
    >
      <View style={styles.headline}>
        <Skeleton
          width={HEADLINE_ICON_SIZE}
          height={HEADLINE_ICON_SIZE}
          radius={radius.small}
        />
        <View style={styles.headlineCopy}>
          <Skeleton height={TITLE_LINE_HEIGHT} radius={radius.xs} />
          <Skeleton height={BAR_HEIGHT} radius={radius.full} />
        </View>
      </View>
    </View>
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
  onAction: (action: RoomCardAction) => void;
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
          onPress={() => onAction(action)}
        />
      )}
    </View>
  );
}

export type RoomCardRoute = 'NextRoom';

/**
 * What the card's button does. Claiming is not a route any more — the reward
 * opens in place, wherever the user is — so the two cases cannot both be
 * expressed as a screen name.
 */
export type RoomCardAction =
  | { label: string; kind: 'route'; route: RoomCardRoute }
  | { label: string; kind: 'claim' };

export interface RoomCardView {
  title: string;
  /** the line under the title, when the title alone does not say the rule */
  note?: string;
  /** drives the icon, the bar and the button */
  tone: RoomCardTone;
  /** the bar counts whatever the title is about, never something else */
  done: number;
  total: number;
  action: RoomCardAction | null;
}

/**
 * The card speaks in terms of today's list — the dailies and the to-dos
 * together — because that is the thing the user controls; the floor number is
 * bookkeeping. A button appears only when there is something waiting that they
 * cannot otherwise reach.
 */
export function describeRoomCard({
  isComplete,
  canClaim,
  claimedToday,
  doneCount,
  totalCount,
  placedCount,
}: {
  isComplete: boolean;
  canClaim: boolean;
  claimedToday: boolean;
  /** everything today asks for, done and in total */
  doneCount: number;
  totalCount: number;
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
      action: { label: 'Pick a new room', kind: 'route', route: 'NextRoom' },
    };
  }

  // The bar stays on today and stays full: the day is what earned this, and
  // dropping to a room count here read as "0 / 7" beside a title saying the
  // thing was ready.
  if (canClaim) {
    return {
      title: 'Your decoration is ready',
      tone: 'ready',
      done: totalCount,
      total: totalCount,
      action: { label: 'Place it in your room', kind: 'claim' },
    };
  }

  if (claimedToday) {
    // Today is what this state is about, so the bar stays on today rather than
    // dropping back to a room count that reads as progress lost — and it counts
    // what is actually left: a to-do added after the decoration was placed is
    // still a to-do, and a full bar over an open list is a lie the list below
    // it immediately contradicts.
    return {
      title: 'All set for today!',
      tone: 'done',
      done: doneCount,
      total: totalCount,
      action: null,
    };
  }

  // Still working through today. The title and the count beside it already say
  // the rule, so the line under them stays empty.
  //
  // The bar counts everything today asks for — the three dailies and the
  // to-dos — because that is what the title asks for. Showing room pieces here
  // read as "unlock a new decoration — 1 / 7", which asks for four days that do
  // not exist.
  //
  // Finishing them can only land in `canClaim` above, never here: that flag is
  // built from the same `allCompleted` this branch would test.
  return {
    title: 'Unlock a new decoration',
    tone: 'waiting',
    done: doneCount,
    total: totalCount,
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
    lineHeight: TITLE_LINE_HEIGHT,
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
