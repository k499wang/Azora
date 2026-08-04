import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RefObject } from 'react';
import {
  Pressable,
  StyleSheet,
  type TextInput as NativeTextInput,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text, TextInput } from '../common/Text';

interface EntrySearchBarProps {
  mode: 'entry';
  onPress: () => void;
}

interface EditableSearchBarProps {
  mode: 'editable';
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
  inputRef: RefObject<NativeTextInput | null>;
  autoFocus?: boolean;
}

type ExerciseSearchBarProps = EntrySearchBarProps | EditableSearchBarProps;

export default function ExerciseSearchBar(props: ExerciseSearchBarProps) {
  if (props.mode === 'entry') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search exercises"
        accessibilityHint="Opens exercise search"
        onPress={props.onPress}
        style={({ pressed }) => [
          styles.surface,
          pressed && styles.surfacePressed,
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={colors.text.secondary}
        />
        <Text style={styles.placeholder}>Search exercises</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.surface}>
      <MaterialCommunityIcons
        name="magnify"
        size={22}
        color={colors.text.secondary}
      />
      <TextInput
        ref={props.inputRef}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder="Search exercises"
        placeholderTextColor={colors.text.tertiary}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={props.autoFocus}
        returnKeyType="search"
        accessibilityLabel="Search exercises"
        style={styles.input}
      />
      {props.value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear exercise search"
          hitSlop={4}
          onPress={props.onClear}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.clearButtonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={20}
            color={colors.text.secondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    height: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: 2,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.elevated,
  },
  surfacePressed: {
    opacity: 0.75,
  },
  placeholder: {
    ...typography.body.medium,
    flex: 1,
    paddingHorizontal: spacing.sm,
    color: colors.text.tertiary,
    fontFamily: fonts.regular,
  },
  input: {
    ...typography.body.medium,
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
    color: colors.text.primary,
    fontFamily: fonts.regular,
  },
  clearButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  clearButtonPressed: {
    opacity: 0.6,
  },
});
