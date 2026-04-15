import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { StreamState } from '../../lib/heartRate/types';

interface LiveBPMBadgeProps {
  bpm: number | null;
  streamState: StreamState;
  onStop: () => void;
}

export function LiveBPMBadge({ bpm, streamState, onStop }: LiveBPMBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const hasBpm = bpm != null && streamState !== 'finger_lost';
  const isStreaming = hasBpm;
  const isLost = streamState === 'finger_lost';
  const isWarmingUp = !hasBpm && (streamState === 'warming_up' || streamState === 'streaming');

  useEffect(() => {
    if (isStreaming) {
      pulseAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(700),
        ]),
      );
      pulseAnimation.current.start();
    } else {
      pulseAnimation.current?.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnimation.current?.stop();
    };
  }, [isStreaming, pulseAnim]);

  const getBadgeStyle = () => {
    if (isLost) return [styles.badge, styles.badgeLost];
    if (isStreaming) return [styles.badge, styles.badgeStreaming];
    return [styles.badge];
  };

  const getContent = () => {
    if (isWarmingUp) {
      return (
        <Text style={styles.warmingText}>Warming up...</Text>
      );
    }

    if (isLost) {
      return (
        <>
          <MaterialCommunityIcons
            name="heart-off-outline"
            size={14}
            color={colors.text.tertiary}
          />
          <Text style={styles.lostText}>-- bpm</Text>
        </>
      );
    }

    if (isStreaming && bpm != null) {
      return (
        <>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <MaterialCommunityIcons
              name="heart"
              size={14}
              color={colors.error[500]}
            />
          </Animated.View>
          <Text style={styles.bpmText}>{bpm} bpm</Text>
        </>
      );
    }

    return <Text style={styles.warmingText}>--</Text>;
  };

  return (
    <TouchableOpacity
      style={getBadgeStyle()}
      onLongPress={onStop}
      activeOpacity={0.9}
      delayLongPress={500}
    >
      <View style={styles.inner}>
        {getContent()}
      </View>
      <View style={styles.stopHint}>
        <Text style={styles.stopHintText}>Hold to stop</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.background.elevated,
    borderRadius: 24,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  badgeStreaming: {
    borderWidth: 1.5,
    borderColor: `${colors.error[500]}30`,
  },
  badgeLost: {
    opacity: 0.7,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warmingText: {
    ...typography.body.small,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  lostText: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  bpmText: {
    ...typography.body.medium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  stopHint: {
    marginTop: 2,
  },
  stopHintText: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
