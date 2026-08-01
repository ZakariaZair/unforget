import { StyleSheet, Text, View } from 'react-native';

type AdviceCardProps = {
  label: string;
  message: string;
};

export function AdviceCard({ label, message }: AdviceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>Keep this close.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    padding: 24,
    backgroundColor: '#242A72',
    borderRadius: 26,
  },
  label: {
    color: '#FF987E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  message: {
    color: '#FFFDF8',
    fontSize: 23,
    fontWeight: '600',
    lineHeight: 32,
  },
  hint: {
    color: '#D6D8F2',
    fontSize: 14,
  },
});
