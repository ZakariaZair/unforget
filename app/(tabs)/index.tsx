import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdviceTree } from '../../components/AdviceTree';
import { colors, fonts } from '../../constants/theme';
import { useAdvice } from '../../providers/AdviceProvider';

const MAX_ADVICE_LENGTH = 100;

export default function RememberScreen() {
  const { addAdvice, isLoading } = useAdvice();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const canSave = text.trim().length > 0 && !isLoading && !isSaving;

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setStatusMessage('');

    try {
      const { notificationResult } = await addAdvice(text);

      setText('');

      if (notificationResult === 'scheduled') {
        setStatusMessage('Saved. A random reminder will arrive each day.');
      } else if (notificationResult === 'permission-denied') {
        setStatusMessage(
          'Saved locally. Enable notifications in your device settings to receive reminders.',
        );
      } else if (notificationResult === 'unsupported') {
        setStatusMessage('Saved locally. Notifications are available on iOS and Android.');
      } else {
        setStatusMessage('Saved locally, but reminders could not be scheduled.');
      }
    } catch {
      setStatusMessage('Could not save this advice. Please try again.');
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
          keyboardShouldPersistTaps="handled"
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
            <AdviceTree />

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
                }}
                onFocus={() => setIsFocused(true)}
                placeholder="Write advice you want to remember…"
                placeholderTextColor={colors.faint}
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

            {statusMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.statusMessage}>
                {statusMessage}
              </Text>
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
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingLeft: 22,
    paddingRight: 8,
    borderRadius: 30,
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
    fontSize: 15,
    letterSpacing: -0.1,
  },
  saveButtonTextDisabled: {
    color: colors.muted,
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.accent,
  },
  arrowDisabled: {
    backgroundColor: colors.disabledStrong,
  },
  arrowText: {
    marginTop: -2,
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 22,
  },
  arrowTextDisabled: {
    color: colors.muted,
  },
  statusMessage: {
    marginTop: 14,
    paddingHorizontal: 12,
    color: colors.positive,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
