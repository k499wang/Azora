import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import Icon from '../../common/icons/Icon';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const VIDEO_SOURCE = require('../../../../assets/onboarding/founder-intro.mp4');
const SKIP_FADE_IN_MS = 4000;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const POSTER_HEIGHT = Math.min(500, Math.max(360, SCREEN_HEIGHT * 0.52));

type VideoPlayer = ReturnType<typeof useVideoPlayer>;

interface FounderVideoScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function FounderVideoScreen({
  stepIndex,
  stepCount,
  onContinue,
  onSkip,
  onBack,
}: FounderVideoScreenProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const posterPlayer = useVideoPlayer(VIDEO_SOURCE, (p: VideoPlayer) => {
    p.muted = true;
    p.loop = false;
  });

  return (
    <OnboardingScreenLayout
      title="A word from the founder"
      subtitle="60 seconds on why we built Azora."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Play founder video"
        onPress={() => setIsPlayerOpen(true)}
        style={({ pressed }) => [
          styles.posterCard,
          pressed && styles.posterCardPressed,
        ]}
      >
        <VideoView
          style={StyleSheet.absoluteFill}
          player={posterPlayer}
          contentFit="cover"
          nativeControls={false}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.playBadge}>
          <View style={styles.playBadgeInner}>
            <Icon name="play-triangle" size={28} color={colors.text.inverse} />
          </View>
        </View>
        <View style={styles.posterFooter}>
          <Text style={styles.posterEyebrow}>From the founders</Text>
          <Text style={styles.posterTitle}>Why Azora exists</Text>
          <Text style={styles.posterMeta}>Tap to play · sound on</Text>
        </View>
      </Pressable>

      <Modal
        visible={isPlayerOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => {
          setIsPlayerOpen(false);
          onContinue();
        }}
      >
        <FounderVideoPlayer
          onFinish={() => {
            setIsPlayerOpen(false);
            onContinue();
          }}
        />
      </Modal>
    </OnboardingScreenLayout>
  );
}

interface FounderVideoPlayerProps {
  onFinish: () => void;
}

function FounderVideoPlayer({ onFinish }: FounderVideoPlayerProps) {
  const insets = useSafeAreaInsets();
  const [hasEnded, setHasEnded] = useState(false);
  const skipOpacity = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(VIDEO_SOURCE, (p: VideoPlayer) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      setHasEnded(true);
    });
    return () => {
      sub.remove();
    };
  }, [player]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(skipOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    }, SKIP_FADE_IN_MS);
    return () => clearTimeout(timeout);
  }, [skipOpacity]);

  const replay = () => {
    player.currentTime = 0;
    player.play();
    setHasEnded(false);
  };

  return (
    <View style={playerStyles.root}>
      <StatusBar barStyle="light-content" />
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        style={[playerStyles.topGradient, { height: insets.top + 96 }]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          playerStyles.skipWrapper,
          { top: insets.top + spacing.md, opacity: skipOpacity },
        ]}
        pointerEvents={hasEnded ? 'none' : 'auto'}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip founder video"
          onPress={onFinish}
          hitSlop={12}
          style={({ pressed }) => [
            playerStyles.skipButton,
            pressed && playerStyles.skipButtonPressed,
          ]}
        >
          <Text style={playerStyles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>

      {hasEnded ? (
        <View style={playerStyles.endScrim}>
          <View
            style={[
              playerStyles.endCard,
              { marginBottom: insets.bottom + spacing.xl },
            ]}
          >
            <Text style={playerStyles.endEyebrow}>Thanks for watching</Text>
            <Text style={playerStyles.endTitle}>Ready to set your baseline?</Text>
            <View style={playerStyles.endActions}>
              <OnboardingPrimaryButton label="Continue" onPress={onFinish} />
              <Pressable
                accessibilityRole="button"
                onPress={replay}
                style={({ pressed }) => [
                  playerStyles.replayButton,
                  pressed && playerStyles.replayButtonPressed,
                ]}
              >
                <Text style={playerStyles.replayText}>Replay</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  posterCard: {
    ...card.base,
    ...card.shadow,
    height: POSTER_HEIGHT,
    aspectRatio: 9 / 16,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#0B1220',
  },
  posterCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },
  playBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadgeInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  posterFooter: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  posterEyebrow: {
    ...typography.body.xsmall,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  posterTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  posterMeta: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
    marginTop: spacing.xs,
  },
});

const playerStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  iconButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  skipWrapper: {
    position: 'absolute',
    right: spacing.md,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  skipButtonPressed: {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  skipText: {
    ...typography.button.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  endScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  endCard: {
    ...card.base,
    ...card.shadow,
    padding: spacing.lg,
  },
  endEyebrow: {
    ...typography.body.xsmall,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  endTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  endActions: {
    gap: spacing.sm,
  },
  replayButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  replayButtonPressed: {
    opacity: 0.6,
  },
  replayText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
