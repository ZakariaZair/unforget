import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArchiveScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>YOUR LIBRARY</Text>
        <Text style={styles.title}>Things I want to remember</Text>
        <Text style={styles.description}>
          Your saved advice will live here, ready to revisit whenever you need it.
        </Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptyText}>
            The first thought you keep will appear in this archive.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  content: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  eyebrow: {
    color: '#EF694D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#171A43',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 40,
  },
  description: {
    color: '#625E6D',
    fontSize: 17,
    lineHeight: 25,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    padding: 28,
    backgroundColor: '#F1ECE2',
    borderRadius: 24,
  },
  emptyTitle: {
    color: '#242A72',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: '#625E6D',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
