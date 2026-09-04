import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput as RNTextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from '../../components/common/Text';
import GlassIconButton from '../../components/common/GlassIconButton';
import ChunkyButton from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import {
  DEFAULT_SELF_CARE_GOAL_ICON,
  MAX_SELF_CARE_GOAL_TITLE_LENGTH,
  normalizeSelfCareGoalTitle,
} from './domain/selfCareGoal';
import {
  GOAL_ICON_CHOICES,
  GOAL_SUGGESTION_CATEGORIES,
  type GoalSuggestion,
} from './goalSuggestions';
import type { IconName } from '../../components/common/icons/paths';

const CLOSE_SIZE = 44;
const BADGE_SIZE = 64;
const BADGE_ICON_SIZE = 32;
const SAVE_MIN_HEIGHT = 48;
const SUGGESTION_ICON_SIZE = 24;
const ICON_TILE_SIZE = 60;
const ICON_TILE_ICON_SIZE = 28;
// The shelf runs to the bottom of the screen, so the tabs sit clear of the home
// indicator rather than on top of it — they are a control, not chrome.
const TABS_LIFT = spacing.lg;
// Deep enough that a suggestion row dissolves over most of its own height.
const SHELF_FADE_HEIGHT = 56;
// The top fade is shallower: it doubles as the gap under the overline, and a
// 56pt one there would push the shelf away from the label that names it.
const SHELF_FADE_TOP_HEIGHT = 32;

const FIRST_CATEGORY = GOAL_SUGGESTION_CATEGORIES[0];

interface AddGoalSheetProps {
  visible: boolean;
  onClose: () => void;
  /** already normalized — the sheet will not call this with an empty title */
  onSubmit: (title: string, icon: IconName) => void;
  pending: boolean;
  error: unknown;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

/**
 * The way onto the list: a full-height sheet on its own color block, with the
 * empty goal card at the top and a shelf of suggestions under it. Writing a
 * to-do is the whole screen for as long as it takes, rather than a row that
 * unfolds inside the list and pushes the day's journey around.
 */
export default function AddGoalSheet({
  visible,
  onClose,
  onSubmit,
  pending,
  error,
}: AddGoalSheetProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<RNTextInput>(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<IconName>(DEFAULT_SELF_CARE_GOAL_ICON);
  const [categoryId, setCategoryId] = useState(FIRST_CATEGORY.id);
  // The picker takes over the shelf rather than opening a layer above it: the
  // icon it is choosing sits on the card right there, so the choice has to stay
  // visible next to what it changes.
  const [pickingIcon, setPickingIcon] = useState(false);

  // The sheet is a fresh sheet every time it opens: the draft and the shelf it
  // was left on belong to the goal that was written, not to the next one.
  useEffect(() => {
    if (visible) return;
    setTitle('');
    setIcon(DEFAULT_SELF_CARE_GOAL_ICON);
    setCategoryId(FIRST_CATEGORY.id);
    setPickingIcon(false);
  }, [visible]);

  const normalizedTitle = normalizeSelfCareGoalTitle(title);
  const category =
    GOAL_SUGGESTION_CATEGORIES.find((entry) => entry.id === categoryId) ??
    FIRST_CATEGORY;

  const save = () => {
    if (normalizedTitle == null || pending) return;
    triggerTapHaptic();
    onSubmit(normalizedTitle, icon);
  };

  // A suggestion fills the card rather than saving straight to the list, so the
  // line stays yours to edit before it becomes a to-do. Its icon comes with it,
  // and the badge above stays tappable if you want a different one.
  const chooseSuggestion = (suggestion: GoalSuggestion) => {
    triggerTapHaptic();
    setTitle(suggestion.title);
    setIcon(suggestion.icon);
    setPickingIcon(false);
    inputRef.current?.focus();
  };

  const chooseIcon = (choice: IconName) => {
    triggerTapHaptic();
    setIcon(choice);
    setPickingIcon(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <StatusBar style="light" />
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <GlassIconButton
            accessibilityLabel="Close"
            size={CLOSE_SIZE}
            onPress={onClose}
          >
            <Icon name="close" size={20} color={colors.text.inverse} />
          </GlassIconButton>
        </View>

        <View style={[card.base, card.shadow, styles.card]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              pickingIcon ? 'Close the icon picker' : 'Change the icon'
            }
            onPress={() => {
              triggerTapHaptic();
              setPickingIcon((picking) => !picking);
            }}
            style={({ pressed }) => [
              styles.badge,
              pickingIcon && styles.badgePicking,
              pressed && pressable.surface,
            ]}
          >
            <Icon
              name={icon}
              size={BADGE_ICON_SIZE}
              color={colors.primary.blue600}
            />
          </Pressable>
          <TextInput
            ref={inputRef}
            value={title}
            onChangeText={setTitle}
            multiline
            submitBehavior="blurAndSubmit"
            onSubmitEditing={save}
            returnKeyType="done"
            maxLength={MAX_SELF_CARE_GOAL_TITLE_LENGTH}
            placeholder="Enter a new goal…"
            placeholderTextColor={colors.text.tertiary}
            editable={!pending}
            style={styles.input}
            accessibilityLabel="Goal"
          />
          {normalizedTitle == null ? null : (
            <ChunkyButton
              shape="card"
              label="Add to my day"
              disabled={pending}
              loading={pending}
              haptic="tap"
              minHeight={SAVE_MIN_HEIGHT}
              onPress={save}
            />
          )}
        </View>

        {error == null ? null : (
          <Text accessibilityRole="alert" style={styles.error}>
            {errorMessage(error)}
          </Text>
        )}

        <Text style={styles.overline}>
          {pickingIcon ? 'Choose an icon' : 'Suggestions'}
        </Text>

        <View style={styles.shelf}>
          <ScrollView
            contentContainerStyle={styles.shelfContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {pickingIcon ? (
              <View style={styles.iconGrid}>
                {GOAL_ICON_CHOICES.map((choice) => {
                  const selected = choice === icon;
                  return (
                    <Pressable
                      key={choice}
                      accessibilityRole="button"
                      accessibilityLabel={choice}
                      accessibilityState={{ selected }}
                      onPress={() => chooseIcon(choice)}
                      style={({ pressed }) => [
                        styles.iconTile,
                        selected && styles.iconTileSelected,
                        pressed && pressable.surface,
                      ]}
                    >
                      <Icon
                        name={choice}
                        size={ICON_TILE_ICON_SIZE}
                        color={colors.text.inverse}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              category.suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.title}
                  accessibilityRole="button"
                  accessibilityLabel={suggestion.title}
                  onPress={() => chooseSuggestion(suggestion)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && pressable.surface,
                  ]}
                >
                  <Icon
                    name={suggestion.icon}
                    size={SUGGESTION_ICON_SIZE}
                    color={colors.text.inverse}
                  />
                  <Text style={styles.suggestionLabel}>{suggestion.title}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
          <LinearGradient
            pointerEvents="none"
            colors={[colors.playful.sky.base, colors.blockFade.sky]}
            style={styles.shelfFadeTop}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[colors.blockFade.sky, colors.playful.sky.base]}
            style={styles.shelfFade}
          />
        </View>

        {pickingIcon ? null : (
        <View style={{ paddingBottom: insets.bottom + TABS_LIFT }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.tabs}
          >
            {GOAL_SUGGESTION_CATEGORIES.map((entry) => {
              const selected = entry.id === category.id;
              return (
                <Pressable
                  key={entry.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    triggerTapHaptic();
                    setCategoryId(entry.id);
                  }}
                  style={({ pressed }) => [
                    styles.tab,
                    selected && styles.tabSelected,
                    pressed && pressable.subtle,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      selected && styles.tabLabelSelected,
                    ]}
                  >
                    {entry.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.playful.sky.base,
    gap: spacing.md,
  },
  topBar: {
    paddingHorizontal: padding.screen.horizontal,
    alignItems: 'flex-start',
  },
  card: {
    marginHorizontal: padding.screen.horizontal,
    borderRadius: radius.sheet,
    padding: spacing.mdPlus,
    gap: spacing.md,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.cardSoft,
  },
  badgePicking: {
    backgroundColor: colors.background.accentSoft,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconTile: {
    width: ICON_TILE_SIZE,
    height: ICON_TILE_SIZE,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onBlock.fill,
  },
  iconTileSelected: {
    backgroundColor: colors.onBlock.fillActive,
  },
  // Sized like a headline, not a form field: the goal is the only thing on the
  // card, so it is written at the size it will be remembered at.
  input: {
    ...typography.title.title2,
    lineHeight: wrappedLineHeight(typography.title.title2.fontSize),
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    padding: 0,
    minHeight: 34,
  },
  error: {
    ...typography.body.small,
    marginHorizontal: padding.screen.horizontal,
    color: colors.error[100],
  },
  overline: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    marginHorizontal: padding.screen.horizontal,
    color: colors.onBlock.textMuted,
  },
  shelf: {
    flex: 1,
    // The top fade is the gap under the overline, so the screen's own gap is
    // taken back rather than stacked on top of it.
    marginTop: -spacing.md,
  },
  // Both fades are clear of the resting list: the padding puts the first and
  // last rows exactly where each gradient runs out, so nothing is dimmed until
  // it is actually scrolling under one.
  shelfContent: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: SHELF_FADE_TOP_HEIGHT,
    paddingBottom: SHELF_FADE_HEIGHT,
    gap: spacing.sm,
  },
  // The shelf runs out into the block at both ends rather than stopping on an
  // edge, so the overline above and the tabs below read as the ends of the list
  // instead of lids clamped on it.
  shelfFadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SHELF_FADE_TOP_HEIGHT,
  },
  shelfFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHELF_FADE_HEIGHT,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.onBlock.fill,
  },
  suggestionLabel: {
    ...typography.heading.heading1,
    lineHeight: wrappedLineHeight(typography.heading.heading1.fontSize),
    fontFamily: fonts.semibold,
    flex: 1,
    color: colors.text.inverse,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: padding.screen.horizontal - spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  tabSelected: {
    backgroundColor: colors.onBlock.fillActive,
  },
  tabLabel: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    color: colors.onBlock.textMuted,
  },
  tabLabelSelected: {
    color: colors.text.inverse,
  },
});
