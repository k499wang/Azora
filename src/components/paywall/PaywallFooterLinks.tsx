import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';

const TERMS_URL = 'https://www.tryazora.app/terms';
const PRIVACY_URL = 'https://www.tryazora.app/privacy';

interface PaywallFooterLinksProps {
  isRestoring: boolean;
  restoreDisabled: boolean;
  onRestore: () => void;
  /** Softer links with a short restore label, for a compact card. */
  quiet?: boolean;
}

export function PaywallFooterLinks({
  isRestoring,
  restoreDisabled,
  onRestore,
  quiet = false,
}: PaywallFooterLinksProps) {
  const textStyle = [styles.text, quiet && styles.quietText];
  const terms = (
    <Pressable
      accessibilityRole="link"
      onPress={() => {
        void Linking.openURL(TERMS_URL);
      }}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Text style={textStyle}>Terms</Text>
    </Pressable>
  );
  const restore = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={quiet ? 'Restore purchases' : undefined}
      disabled={restoreDisabled}
      onPress={onRestore}
      style={({ pressed }) => [
        styles.item,
        pressed && styles.pressed,
        restoreDisabled && styles.disabled,
      ]}
    >
      <Text numberOfLines={1} style={textStyle}>
        {isRestoring ? 'Restoring...' : quiet ? 'Restore' : 'Restore Purchase'}
      </Text>
    </Pressable>
  );
  const privacy = (
    <Pressable
      accessibilityRole="link"
      onPress={() => {
        void Linking.openURL(PRIVACY_URL);
      }}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Text style={textStyle}>Privacy</Text>
    </Pressable>
  );
  return (
    <View style={styles.row}>
      {quiet ? <>{privacy}{terms}{restore}</> : <>{terms}{restore}{privacy}</>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.button.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  quietText: {
    fontFamily: fonts.regular,
    color: colors.text.tertiary,
  },
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
