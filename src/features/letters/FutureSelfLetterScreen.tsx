import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { FutureSelfLetterScreenProps } from '../../app/navigation';
import { Text } from '../../components/common/Text';
import ChunkyButton from '../../components/common/ChunkyButton';
import CloseButton from '../../components/common/CloseButton';
import { useAuthStore } from '../../stores/authStore';
import { card, LINE, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { useFutureSelfLetter } from './useFutureSelfLetter';
import WaxSeal from './WaxSeal';

const RULE = typography.body.large.lineHeight;
const PAPER_TOP = RULE * 2;
const MARGIN_X = spacing.xl;
const SEAL_SIZE = spacing['4xl'];
const ENTER_TILT = -3;
const REST_TILT = -1;
const SPRING = { damping: 12, stiffness: 120, mass: 0.9 };

export default function FutureSelfLetterScreen({ navigation }: FutureSelfLetterScreenProps) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { letter, dateline, markSeen } = useFutureSelfLetter(userId);
  const [paperHeight, setPaperHeight] = useState(0);
  const tilt = useSharedValue(ENTER_TILT);
  const rise = useSharedValue<number>(spacing['2xl']);

  useEffect(() => {
    tilt.value = withSpring(REST_TILT, SPRING);
    rise.value = withSpring(0, SPRING);
  }, [tilt, rise]);

  const entrance = useAnimatedStyle(() => ({
    transform: [{ translateY: rise.value }, { rotate: `${tilt.value}deg` }],
  }));

  const close = () => {
    markSeen();
    navigation.goBack();
  };

  const ruleCount = Math.max(0, Math.floor((paperHeight - PAPER_TOP) / RULE));
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
          <Animated.View
            style={[styles.paper, entrance]}
            onLayout={(event) => setPaperHeight(event.nativeEvent.layout.height)}
          >
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {Array.from({ length: ruleCount }, (_, i) => (
                <View key={i} style={[styles.rule, { top: PAPER_TOP + (i + 1) * RULE - LINE }]} />
              ))}
              <View style={styles.marginLine} />
            </View>
            <View style={styles.seal}>
              <WaxSeal size={SEAL_SIZE} />
            </View>
            <Text style={styles.dateline}>{dateline}</Text>
            <Text style={styles.heading}>{letter.heading}</Text>
            {letter.paragraphs.map(({ text, emphasis }) =>
              emphasis ? (
                <Text key={text} style={styles.emphasis}>
                  <Text style={styles.highlight}>{text}</Text>
                </Text>
              ) : (
                <Text key={text} style={styles.body}>
                  {text}
                </Text>
              ),
            )}
            <View style={styles.signOff}>
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
    backgroundColor: colors.background.elevated,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    paddingTop: PAPER_TOP - RULE,
    paddingBottom: RULE,
    paddingLeft: MARGIN_X + spacing.md,
    paddingRight: spacing.lg,
    gap: RULE,
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: MARGIN_X,
    width: LINE,
    backgroundColor: colors.playful.coral.tint,
  },
  seal: {
    position: 'absolute',
    top: -SEAL_SIZE / 2,
    left: '50%',
    marginLeft: -SEAL_SIZE / 2,
  },
  dateline: {
    ...typography.body.small,
    lineHeight: RULE,
    color: colors.text.secondary,
    textAlign: 'right',
    marginBottom: -RULE,
  },
  heading: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    lineHeight: RULE,
    color: colors.text.primary,
  },
  body: {
    ...typography.body.large,
    lineHeight: RULE,
    color: colors.text.primary,
  },
  emphasis: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    lineHeight: RULE,
    color: colors.text.primary,
  },
  highlight: {
    fontFamily: fonts.semibold,
    backgroundColor: colors.playful.amber.soft,
  },
  signOff: {
    alignItems: 'flex-end',
  },
  signOffText: {
    ...typography.body.large,
    lineHeight: RULE,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
