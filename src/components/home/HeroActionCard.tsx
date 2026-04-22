import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface HeroActionCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
}

const SUNRISE = require('../../../assets/sunrise-morning-with-orange-yellow-pink-blue-sky-dramatic-twilight-landscape-with-sunset-sky-in-evening-horizon-beautiful-nature-banner-of-sunrise-or-sunlight-for-four-seasons-background-vector.jpg');

export default function HeroActionCard({ title, subtitle, onPress }: HeroActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardWrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Start ${title}`}
    >
      <ImageBackground
        source={SUNRISE}
        style={styles.card}
        imageStyle={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(15,23,42,0.15)', 'rgba(15,23,42,0.55)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.row}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.playCircle}>
            <MaterialCommunityIcons name="play" size={18} color={colors.orange[600]} />
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: 22,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 10,
    overflow: 'hidden',
  },
  card: {
    padding: spacing.md,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.inverse,
  },
  subtitle: {
    ...typography.body.small,
    color: 'rgba(255,255,255,0.9)',
  },
  playCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.96,
  },
});
