import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  FlatList,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '../../constants/theme';
import { scheduleTestNotification } from '../../lib/notifications';
import { useAdvice } from '../../providers/AdviceProvider';
import { Advice } from '../../types/advice';

const DELETE_ACTION_WIDTH = 88;

function formatAdviceDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type SwipeableRowHandle = {
  close: () => void;
};

type AdviceRowProps = {
  canDelete: boolean;
  index: number;
  item: Advice;
  onDelete: (id: string) => void;
  onOpen: (handle: SwipeableRowHandle) => void;
};

function AdviceRow({
  canDelete,
  index,
  item,
  onDelete,
  onOpen,
}: AdviceRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const gestureStartX = useRef(0);
  const isOpen = useRef(false);

  const close = useCallback(() => {
    isOpen.current = false;
    Animated.spring(translateX, {
      bounciness: 0,
      speed: 24,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const open = useCallback(() => {
    isOpen.current = true;
    onOpen({ close });
    Animated.spring(translateX, {
      bounciness: 0,
      speed: 24,
      toValue: -DELETE_ACTION_WIDTH,
      useNativeDriver: true,
    }).start();
  }, [close, onOpen, translateX]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) =>
      canDelete &&
      Math.abs(gesture.dx) > 8 &&
      Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: () => {
      translateX.stopAnimation();
      gestureStartX.current = isOpen.current ? -DELETE_ACTION_WIDTH : 0;
    },
    onPanResponderMove: (_event, gesture) => {
      const nextX = Math.max(
        -DELETE_ACTION_WIDTH,
        Math.min(0, gestureStartX.current + gesture.dx),
      );
      translateX.setValue(nextX);
    },
    onPanResponderRelease: (_event, gesture) => {
      const nextX = gestureStartX.current + gesture.dx;

      if (nextX < -DELETE_ACTION_WIDTH / 2 || gesture.vx < -0.4) {
        open();
      } else {
        close();
      }
    },
    onPanResponderTerminate: close,
  });

  return (
    <View style={styles.swipeContainer}>
      {canDelete ? (
        <Pressable
          accessibilityLabel={`Delete ${item.text}`}
          accessibilityRole="button"
          onPress={() => {
            close();
            onDelete(item.id);
          }}
          style={({ pressed }) => [
            styles.deleteAction,
            pressed && styles.deleteActionPressed,
          ]}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </Pressable>
      ) : null}

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...(canDelete ? panResponder.panHandlers : {})}
      >
        <View style={styles.adviceRow}>
          <Text style={styles.rowNumber}>
            {(index + 1).toString().padStart(2, '0')}
          </Text>
          <Text style={styles.adviceText}>{item.text}</Text>
          <Text style={styles.adviceDate}>{formatAdviceDate(item.createdAt)}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function ArchiveScreen() {
  const { advice, clearAdvice, deleteAdvice, isLoading } = useAdvice();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const openSwipeableRef = useRef<SwipeableRowHandle | null>(null);

  const canTest = advice.length > 0 && !isLoading && !isTesting && !isDeleting;
  const canClear = advice.length > 0 && !isLoading && !isTesting && !isDeleting;

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

  async function handleDeleteAdvice(id: string) {
    if (isDeleting || advice.length === 0) {
      return;
    }

    setIsDeleting(true);
    setTestMessage('');
    openSwipeableRef.current = null;

    try {
      await deleteAdvice(id);
      setTestMessage('Advice deleted.');
    } catch {
      setTestMessage('This advice could not be deleted. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  async function clearAllAdvice() {
    if (!canClear) {
      return;
    }

    setIsDeleting(true);
    setTestMessage('');
    openSwipeableRef.current?.close();
    openSwipeableRef.current = null;

    try {
      await clearAdvice();
    } catch {
      setTestMessage('Your advice could not be deleted. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  function handleClearAllAdvice() {
    if (!canClear) {
      return;
    }

    Alert.alert(
      'Delete all advice?',
      `This will permanently delete all ${advice.length} saved ${
        advice.length === 1 ? 'advice entry' : 'advice entries'
      } and cancel their scheduled reminders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            void clearAllAdvice();
          },
        },
      ],
    );
  }

  function handleOpenSwipeable(handle: SwipeableRowHandle) {
    if (openSwipeableRef.current !== handle) {
      openSwipeableRef.current?.close();
      openSwipeableRef.current = handle;
    }
  }

  function renderAdvice({ item, index }: { item: Advice; index: number }) {
    return (
      <AdviceRow
        canDelete={!isDeleting}
        index={index}
        item={item}
        onDelete={(id) => {
          void handleDeleteAdvice(id);
        }}
        onOpen={handleOpenSwipeable}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        contentContainerStyle={styles.content}
        data={advice}
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
            <Text style={styles.loadingText}>
              {isLoading ? 'Loading advice…' : 'No saved advice yet.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          advice.length > 0 && !isLoading ? (
            <View style={styles.footer}>
              <Pressable
                accessibilityLabel="Delete all saved advice"
                accessibilityRole="button"
                disabled={!canClear}
                onPress={handleClearAllAdvice}
                style={({ pressed }) => [
                  styles.clearButton,
                  !canClear && styles.clearButtonDisabled,
                  pressed && canClear && styles.clearButtonPressed,
                ]}
              >
                <Text style={styles.clearButtonText}>
                  {isDeleting ? 'Deleting…' : 'Delete all advice'}
                </Text>
              </Pressable>
            </View>
          ) : null
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
    backgroundColor: colors.canvas,
  },
  swipeContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  deleteAction: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.negative,
  },
  deleteActionPressed: {
    opacity: 0.82,
  },
  deleteActionText: {
    color: colors.white,
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
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
  footer: {
    paddingTop: 32,
  },
  clearButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.negative,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  clearButtonDisabled: {
    opacity: 0.45,
  },
  clearButtonPressed: {
    backgroundColor: colors.accentSoft,
  },
  clearButtonText: {
    color: colors.negative,
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
  },
});
