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
}

export function PaywallFooterLinks({
  isRestoring,
  restoreDisabled,
  onRestore,
}: PaywallFooterLinksProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL(TERMS_URL);
        }}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <Text style={styles.text}>Terms</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={restoreDisabled}
        onPress={onRestore}
        style={({ pressed }) => [
          styles.item,
          pressed && styles.pressed,
          restoreDisabled && styles.disabled,
        ]}
      >
        <Text numberOfLines={1} style={styles.text}>
          {isRestoring ? 'Restoring...' : 'Restore Purchase'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL(PRIVACY_URL);
        }}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <Text style={styles.text}>Privacy</Text>
      </Pressable>
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
    fontWeight: '500',
    color: colors.neutral[0],
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
