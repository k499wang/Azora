import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Deterministic star positions — no randomness at render time
const STARS: { top: string; left: string; size: number; opacity: number }[] = [
  { top: '2%',  left: '8%',  size: 2,   opacity: 0.9 },
  { top: '3%',  left: '55%', size: 1.5, opacity: 0.7 },
  { top: '5%',  left: '30%', size: 2.5, opacity: 0.8 },
  { top: '6%',  left: '78%', size: 1.5, opacity: 0.6 },
  { top: '8%',  left: '18%', size: 1,   opacity: 0.5 },
  { top: '9%',  left: '90%', size: 2,   opacity: 0.8 },
  { top: '11%', left: '43%', size: 1.5, opacity: 0.7 },
  { top: '12%', left: '65%', size: 2,   opacity: 0.9 },
  { top: '14%', left: '5%',  size: 1,   opacity: 0.5 },
  { top: '15%', left: '82%', size: 2.5, opacity: 0.8 },
  { top: '17%', left: '25%', size: 1.5, opacity: 0.6 },
  { top: '18%', left: '50%', size: 1,   opacity: 0.5 },
  { top: '20%', left: '70%', size: 2,   opacity: 0.7 },
  { top: '21%', left: '12%', size: 2.5, opacity: 0.9 },
  { top: '23%', left: '38%', size: 1,   opacity: 0.5 },
  { top: '24%', left: '92%', size: 1.5, opacity: 0.7 },
  { top: '26%', left: '60%', size: 2,   opacity: 0.8 },
  { top: '28%', left: '22%', size: 1,   opacity: 0.4 },
  { top: '30%', left: '48%', size: 2.5, opacity: 0.7 },
  { top: '31%', left: '75%', size: 1.5, opacity: 0.6 },
  { top: '33%', left: '3%',  size: 1,   opacity: 0.5 },
  { top: '35%', left: '85%', size: 2,   opacity: 0.8 },
  { top: '4%',  left: '95%', size: 1.5, opacity: 0.6 },
  { top: '7%',  left: '40%', size: 1,   opacity: 0.4 },
  { top: '10%', left: '72%', size: 2,   opacity: 0.7 },
  { top: '13%', left: '33%', size: 1.5, opacity: 0.5 },
  { top: '16%', left: '88%', size: 1,   opacity: 0.4 },
  { top: '19%', left: '15%', size: 2.5, opacity: 0.8 },
  { top: '22%', left: '57%', size: 1,   opacity: 0.5 },
  { top: '25%', left: '97%', size: 2,   opacity: 0.7 },
  { top: '27%', left: '28%', size: 1.5, opacity: 0.6 },
  { top: '29%', left: '66%', size: 1,   opacity: 0.4 },
  { top: '32%', left: '42%', size: 2,   opacity: 0.7 },
  { top: '34%', left: '10%', size: 1.5, opacity: 0.6 },
  { top: '36%', left: '79%', size: 1,   opacity: 0.5 },
];

export default function StarryBackground() {
  return (
    <LinearGradient
      colors={['#020510', '#060d1f', '#0a1628', '#0d1f3a']}
      locations={[0, 0.3, 0.65, 1]}
      style={StyleSheet.absoluteFill}
    >
      {STARS.map((star, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: star.top as any,
              left: star.left as any,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
