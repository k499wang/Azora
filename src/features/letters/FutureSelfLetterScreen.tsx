import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { FutureSelfLetterScreenProps } from '../../app/navigation';
import { Text } from '../../components/common/Text';
import ChunkyButton from '../../components/common/ChunkyButton';
import CloseButton from '../../components/common/CloseButton';
import { useAuthStore } from '../../stores/authStore';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { useFutureSelfLetter } from './useFutureSelfLetter';
import WaxSeal from './WaxSeal';

const RULE = typography.body.large.lineHeight;
const SEAL_SIZE = spacing['4xl'];
const ENTER_TILT = 2;
const SPRING = { damping: 12, stiffness: 120, mass: 0.9 };

export default function FutureSelfLetterScreen({ navigation }: FutureSelfLetterScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { letter, dateline, markSeen } = useFutureSelfLetter(userId);
  const tilt = useSharedValue(ENTER_TILT);
  const rise = useSharedValue<number>(spacing['2xl']);

  useEffect(() => {
    tilt.value = withSpring(0, SPRING);
    rise.value = withSpring(0, SPRING);
  }, [tilt, rise]);

  const entrance = useAnimatedStyle(() => ({
    transform: [{ translateY: rise.value }, { rotate: `${tilt.value}deg` }],
  }));

  const close = () => {
    markSeen();
    navigation.goBack();
  };

  const [signOffLead, ...signOffName] = letter?.signOff.split('\n') ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <CloseButton onPress={close} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {letter != null ? (
          <Animated.View style={[styles.paper, entrance]}>
            <View style={styles.seal}>
              <WaxSeal size={SEAL_SIZE} broken />
            </View>
            <Text style={styles.dateline}>{dateline}</Text>
            <Text style={styles.heading}>{letter.heading}</Text>
            {letter.paragraphs.map(({ text, emphasis }) => (
              <Text key={text} style={emphasis ? styles.emphasis : styles.body}>
                {text}
              </Text>
            ))}
            <View>
              <Text style={styles.signOffText}>{signOffLead}</Text>
              <Text style={styles.signOffText}>{signOffName.join(' ')}</Text>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <ChunkyButton label="I'm in" onPress={close} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingTop: SEAL_SIZE / 2 + spacing.md,
    paddingBottom: spacing.xl,
  },
  paper: {
    ...card.shadow,
    width: '92%',
    backgroundColor: colors.background.card,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    paddingTop: SEAL_SIZE / 2 + spacing.md,
    paddingBottom: RULE,
    paddingHorizontal: spacing.xl,
    gap: RULE,
  },
  seal: {
    position: 'absolute',
    top: -SEAL_SIZE / 2,
    left: '50%',
    marginLeft: -SEAL_SIZE / 2,
  },
  dateline: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: -spacing.sm,
  },
  heading: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    lineHeight: RULE,
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    ...typography.body.large,
    lineHeight: RULE,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emphasis: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    lineHeight: RULE,
    color: colors.text.primary,
    textAlign: 'center',
  },
  signOffText: {
    ...typography.body.large,
    lineHeight: RULE,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
