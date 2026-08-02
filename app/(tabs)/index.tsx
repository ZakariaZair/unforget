import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ADVICE_TREE_HEIGHT, AdviceTree } from '../../components/AdviceTree';
import { colors, fonts } from '../../constants/theme';
import { syncRandomNotifications } from '../../lib/notifications';
import {
  AdviceLimitError,
  useAdvice,
} from '../../providers/AdviceProvider';
import { MAX_ADVICE_COUNT, MAX_ADVICE_LENGTH } from '../../types/advice';

export default function RememberScreen() {
  const { addAdvice, advice, isLoading } = useAdvice();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [treeAnimationCycle, setTreeAnimationCycle] = useState(0);
  const adviceRef = useRef(advice);
  const hasFocusedRemember = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const shouldRefreshNotificationsAfterSettings = useRef(false);

  const hasReachedAdviceLimit = advice.length >= MAX_ADVICE_COUNT;
  const canSave =
    text.trim().length > 0 &&
    !hasReachedAdviceLimit &&
    !isLoading &&
    !isSaving;

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRemember.current) {
        setTreeAnimationCycle((cycle) => cycle + 1);
      } else {
        hasFocusedRemember.current = true;
      }
    }, []),
  );

  const revealComposer = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', revealComposer);

    return () => subscription.remove();
  }, [revealComposer]);

  useEffect(() => {
    adviceRef.current = advice;
  }, [advice]);

  useEffect(() => {
    let isMounted = true;

    const subscription = AppState.addEventListener('change', (state) => {
      if (
        state !== 'active' ||
        !shouldRefreshNotificationsAfterSettings.current
      ) {
        return;
      }

      shouldRefreshNotificationsAfterSettings.current = false;

      void syncRandomNotifications(adviceRef.current, false)
        .then((result) => {
          if (!isMounted) {
            return;
          }

          if (result === 'scheduled') {
            setShowNotificationSettings(false);
            setStatusMessage(
              'Notifications are enabled. Daily reminders are scheduled.',
            );
          } else if (result === 'paused') {
            setShowNotificationSettings(false);
            setStatusMessage(
              'Your advice is saved. Daily reminders are paused in Settings.',
            );
          } else if (result === 'permission-denied') {
            setShowNotificationSettings(true);
            setStatusMessage(
              Platform.OS === 'ios'
                ? 'Your advice was saved, but notifications are currently disabled. You can enable them in iOS Settings.'
                : 'Your advice was saved, but notifications are currently disabled. You can enable them in app settings.',
            );
          }
        })
        .catch(() => {
          if (isMounted) {
            setShowNotificationSettings(true);
            setStatusMessage(
              Platform.OS === 'ios'
                ? 'Your advice is saved, but notification access could not be confirmed. Check it in iOS Settings.'
                : 'Your advice is saved, but notification access could not be confirmed. Check it in app settings.',
            );
          }
        });
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  async function handleOpenNotificationSettings() {
    shouldRefreshNotificationsAfterSettings.current = true;

    try {
      await Linking.openSettings();
    } catch {
      shouldRefreshNotificationsAfterSettings.current = false;
      setStatusMessage(
        Platform.OS === 'ios'
          ? 'Could not open iOS Settings. Open Settings and select Unforget to enable notifications.'
          : 'Could not open app settings. Open your device settings and select Unforget to enable notifications.',
      );
    }
  }

  async function handleSave() {
    inputRef.current?.blur();
    Keyboard.dismiss();

    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setShowNotificationSettings(false);

    try {
      const { notificationResult } = await addAdvice(text);

      setText('');

      if (notificationResult === 'scheduled') {
        setStatusMessage('Saved. Daily reminders are scheduled.');
      } else if (notificationResult === 'paused') {
        setStatusMessage(
          'Your advice was saved. Daily reminders are paused; resume them in Settings.',
        );
      } else if (notificationResult === 'permission-denied') {
        setShowNotificationSettings(true);
        setStatusMessage(
          Platform.OS === 'ios'
            ? 'Your advice was saved, but notifications are currently disabled. You can enable them in iOS Settings.'
            : 'Your advice was saved, but notifications are currently disabled. You can enable them in app settings.',
        );
      } else if (notificationResult === 'unsupported') {
        setStatusMessage('Saved locally. Notifications are available on iOS and Android.');
      } else {
        setStatusMessage('Saved locally, but reminders could not be scheduled.');
      }
    } catch (error) {
      setStatusMessage(
        error instanceof AdviceLimitError
          ? `Your archive can hold up to ${MAX_ADVICE_COUNT} pieces of advice. Delete one before saving another.`
          : 'Could not save this advice. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => {
            inputRef.current?.blur();
            Keyboard.dismiss();
          }}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <Image
              accessibilityLabel="Unforget logo"
              resizeMode="contain"
              source={require('../../assets/logo.png')}
              style={styles.brandLogo}
            />
            <Text style={styles.brandName}>unforget</Text>
          </View>

          <View style={styles.composer}>
            {isLoading ? (
              <View style={styles.treePlaceholder} />
            ) : (
              <AdviceTree
                adviceCount={advice.length}
                key={`advice-tree-v5-${advice.length}-${treeAnimationCycle}`}
              />
            )}

            <View
              style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused,
              ]}
            >
              <TextInput
                accessibilityLabel="Advice to remember"
                maxLength={MAX_ADVICE_LENGTH}
                multiline
                onBlur={() => setIsFocused(false)}
                onChangeText={(nextText) => {
                  setText(nextText);
                  setStatusMessage('');
                  setShowNotificationSettings(false);
                }}
                onFocus={() => {
                  setIsFocused(true);
                  requestAnimationFrame(revealComposer);
                }}
                placeholder="Write advice you want to remember…"
                placeholderTextColor={colors.faint}
                ref={inputRef}
                style={styles.input}
                textAlignVertical="top"
                value={text}
              />

              <Text pointerEvents="none" style={styles.characterCount}>
                {text.length.toString().padStart(2, '0')} / {MAX_ADVICE_LENGTH}
              </Text>
            </View>

            <Pressable
              accessibilityHint="Stores this advice in your archive"
              accessibilityRole="button"
              disabled={!canSave}
              hitSlop={{ top: 8, bottom: 8 }}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                !canSave && styles.saveButtonDisabled,
                pressed && canSave && styles.saveButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  !canSave && styles.saveButtonTextDisabled,
                ]}
              >
                {isSaving ? 'Saving…' : 'Save advice'}
              </Text>
              <View style={[styles.arrow, !canSave && styles.arrowDisabled]}>
                <Text
                  style={[
                    styles.arrowText,
                    !canSave && styles.arrowTextDisabled,
                  ]}
                >
                  ↗
                </Text>
              </View>
            </Pressable>

            {statusMessage || hasReachedAdviceLimit ? (
              <View style={styles.statusArea}>
                <Text
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.statusMessage,
                    showNotificationSettings && styles.statusMessageWarning,
                  ]}
                >
                  {statusMessage ||
                    `Your archive is full. Delete one of your ${MAX_ADVICE_COUNT} saved pieces to add another.`}
                </Text>

                {showNotificationSettings ? (
                  <Pressable
                    accessibilityHint="Opens Unforget's notification settings"
                    accessibilityRole="button"
                    onPress={() => {
                      void handleOpenNotificationSettings();
                    }}
                    style={({ pressed }) => [
                      styles.settingsButton,
                      pressed && styles.settingsButtonPressed,
                    ]}
                  >
                    <Text style={styles.settingsButtonText}>
                      {Platform.OS === 'ios' ? 'Open iOS Settings' : 'Open Settings'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 124,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 48,
    height: 48,
    marginHorizontal: -8,
    marginVertical: -8,
  },
  brandName: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 29,
  },
  composer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 20,
  },
  treePlaceholder: {
    height: ADVICE_TREE_HEIGHT,
  },
  inputContainer: {
    position: 'relative',
    minHeight: 168,
    marginTop: 10,
    overflow: 'hidden',
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  inputContainerFocused: {
    borderColor: colors.ink,
  },
  input: {
    minHeight: 168,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 27,
  },
  characterCount: {
    position: 'absolute',
    right: 17,
    bottom: 12,
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.35,
    opacity: 0.46,
  },
  saveButton: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingLeft: 16,
    paddingRight: 4,
    borderRadius: 16,
    backgroundColor: colors.ink,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  saveButtonText: {
    color: colors.surface,
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  saveButtonTextDisabled: {
    color: colors.muted,
  },
  arrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  arrowDisabled: {
    backgroundColor: colors.disabledStrong,
  },
  arrowText: {
    marginTop: -1,
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  arrowTextDisabled: {
    color: colors.muted,
  },
  statusArea: {
    marginTop: 14,
    alignItems: 'center',
  },
  statusMessage: {
    paddingHorizontal: 12,
    color: colors.positive,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  statusMessageWarning: {
    color: colors.negative,
  },
  settingsButton: {
    minHeight: 38,
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    borderColor: colors.line,
    borderRadius: 19,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  settingsButtonPressed: {
    backgroundColor: colors.accentSoft,
  },
  settingsButtonText: {
    color: colors.ink,
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
  },
});
