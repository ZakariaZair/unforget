import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdviceCard } from '../../components/AdviceCard';

export default function RememberScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>UNFORGET</Text>
          <Text style={styles.title}>What do you want to remember?</Text>
          <Text style={styles.subtitle}>
            Keep the advice that matters and let it find you again.
          </Text>
        </View>

        <AdviceCard
          label="A thought for today"
          message="You work better when you start with the smallest possible version."
        />

        <View style={styles.captureCard}>
          <Text style={styles.captureTitle}>Save something worth remembering</Text>
          <Text style={styles.captureText}>
            Advice, encouragement, or a realization you want your future self to hear.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  content: {
    gap: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 32,
  },
  intro: {
    gap: 10,
  },
  eyebrow: {
    color: '#EF694D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#171A43',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 42,
  },
  subtitle: {
    color: '#625E6D',
    fontSize: 17,
    lineHeight: 25,
  },
  captureCard: {
    gap: 8,
    padding: 22,
    borderColor: '#DED7CA',
    borderRadius: 22,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  captureTitle: {
    color: '#242A72',
    fontSize: 17,
    fontWeight: '700',
  },
  captureText: {
    color: '#625E6D',
    fontSize: 15,
    lineHeight: 22,
  },
});
