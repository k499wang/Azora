import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, scaleType } from '../../theme/typography';

export const azoChatColors = {
  background: colors.background.canvas,
  card: colors.background.card,
  ink: colors.text.primary,
  muted: colors.text.secondary,
  bubble: colors.background.card,
  reply: colors.surface.selected,
  accent: colors.primary.blue500,
  replyInk: colors.text.brand,
  border: colors.border.subtle,
};

export function AzoChatAvatar({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Image
        source={require('../../../assets/mascot/azo-head.png')}
        style={styles.image}
        contentFit="contain"
        accessible={false}
      />
    </View>
  );
}

export function AzoChatBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Icon name="chevron-left" size={26} color={azoChatColors.ink} />
    </Pressable>
  );
}

interface AzoChatHeaderProps {
  onBack: () => void;
  /** the screen's content column, so the header lines up with the transcript */
  columnStyle?: StyleProp<ViewStyle>;
  /** trailing control, e.g. Skip */
  children?: ReactNode;
}

/** A messaging-app header: back, Azo's face, his name and "Online". */
export function AzoChatHeader({ onBack, columnStyle, children }: AzoChatHeaderProps) {
  return (
    <View style={styles.headerBorder}>
      <View style={[columnStyle, styles.header]}>
        <AzoChatBackButton onPress={onBack} />
        <AzoChatAvatar />
        <View style={styles.identity}>
          <Text accessibilityRole="header" style={styles.name}>Azo</Text>
          <View style={styles.status}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineLabel}>Online</Text>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: azoChatColors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  identity: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.semibold, fontSize: scaleType(24), lineHeight: scaleType(28), color: azoChatColors.ink },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: azoChatColors.accent },
  onlineLabel: { fontSize: scaleType(18), lineHeight: scaleType(22), color: azoChatColors.muted },
  avatar: {
    borderRadius: 13,
    backgroundColor: colors.primary.blue100,
    padding: 3,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.65 },
});
