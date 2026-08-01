import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '../../constants/theme';
import { scheduleTestNotification } from '../../lib/notifications';
import { useAdvice } from '../../providers/AdviceProvider';
import { Advice } from '../../types/advice';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const PREVIEW_ADVICE: Advice[] = [
  {
    id: 'preview-attention',
    text: 'Protect your attention; it becomes your life.',
    createdAt: new Date(Date.now() - 2 * DAY_IN_MILLISECONDS).toISOString(),
  },
  {
    id: 'preview-courage',
    text: 'Ask the question, even when your voice shakes.',
    createdAt: new Date(Date.now() - 8 * DAY_IN_MILLISECONDS).toISOString(),
  },
  {
    id: 'preview-rest',
    text: 'Rest is part of the work, not a reward for finishing it.',
    createdAt: new Date(Date.now() - 15 * DAY_IN_MILLISECONDS).toISOString(),
  },
];

function formatAdviceDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ArchiveScreen() {
  const { advice, isLoading } = useAdvice();
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  const isShowingPreview = !isLoading && advice.length === 0;
  const displayedAdvice = isShowingPreview ? PREVIEW_ADVICE : advice;
  const canTest = advice.length > 0 && !isLoading && !isTesting;

  async function handleTestNotification() {
    if (!canTest) {
      return;
    }

    setIsTesting(true);
    setTestMessage('');

    try {
      const result = await scheduleTestNotification(advice);

      if (result === 'scheduled') {
        setTestMessage('Test scheduled. It should appear in a few seconds.');
      } else if (result === 'permission-denied') {
        setTestMessage('Enable notifications in your device settings, then try again.');
      } else {
        setTestMessage('Notification testing is available on iOS and Android.');
      }
    } catch {
      setTestMessage('The test notification could not be scheduled.');
    } finally {
      setIsTesting(false);
    }
  }

  function renderAdvice({ item, index }: { item: Advice; index: number }) {
    return (
      <View style={styles.adviceRow}>
        <Text style={styles.rowNumber}>{(index + 1).toString().padStart(2, '0')}</Text>
        <Text style={styles.adviceText}>{item.text}</Text>
        <Text style={styles.adviceDate}>{formatAdviceDate(item.createdAt)}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        contentContainerStyle={styles.content}
        data={displayedAdvice}
        keyExtractor={(item) => item.id}
        renderItem={renderAdvice}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Archive</Text>

              <Pressable
                accessibilityLabel="Schedule a test reminder"
                accessibilityRole="button"
                disabled={!canTest}
                onPress={handleTestNotification}
                style={({ pressed }) => [
                  styles.testButton,
                  !canTest && styles.testButtonDisabled,
                  pressed && canTest && styles.testButtonPressed,
                ]}
              >
                <View style={styles.testButtonDot} />
                <Text style={styles.testButtonText}>
                  {isTesting ? 'Sending' : 'Test'}
                </Text>
              </Pressable>
            </View>

            {testMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.testMessage}>
                {testMessage}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.loadingRow}>
            <Text style={styles.loadingText}>Loading advice…</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 124,
  },
  header: {
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 58,
    letterSpacing: -1.4,
    lineHeight: 60,
  },
  testButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
    paddingHorizontal: 15,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  testButtonDisabled: {
    opacity: 0.42,
  },
  testButtonPressed: {
    backgroundColor: colors.accentSoft,
  },
  testButtonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderColor: colors.ink,
    borderWidth: 1,
  },
  testButtonText: {
    color: colors.ink,
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
  },
  testMessage: {
    marginTop: 12,
    color: colors.positive,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 16,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowNumber: {
    width: 24,
    paddingTop: 2,
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  adviceText: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  adviceDate: {
    width: 78,
    paddingTop: 2,
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.35,
    lineHeight: 13,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  loadingRow: {
    paddingVertical: 24,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loadingText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
