import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '../../constants/theme';
import { syncRandomNotifications } from '../../lib/notifications';
import {
  DEFAULT_REMINDER_TIME_RANGE,
  loadReminderTimeRange,
  ReminderTimeRange,
  REMINDER_TIME_STEP_MINUTES,
  saveReminderTimeRange,
} from '../../lib/reminder-time-range';
import {
  loadRemindersPaused,
  saveRemindersPaused,
} from '../../lib/reminder-pause';
import { useAdvice } from '../../providers/AdviceProvider';

const PRIVACY_URL = 'https://unforget.expo.app/privacy';
const SUPPORT_URL = 'https://unforget.expo.app/support';

type NotificationStatus = 'Checking…' | 'Disabled' | 'Enabled' | 'Not requested' | 'Unavailable';

type SettingsRowProps = {
  destructive?: boolean;
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  value?: string;
};

type TimeAdjusterProps = {
  canDecrease: boolean;
  canIncrease: boolean;
  disabled: boolean;
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  value: string;
};

function SettingsRow({
  destructive = false,
  disabled = false,
  label,
  onPress,
  value,
}: SettingsRowProps) {
  const content = (
    <>
      <Text
        style={[
          styles.rowLabel,
          destructive && styles.destructiveText,
          disabled && styles.disabledText,
        ]}
      >
        {label}
      </Text>

      <View style={styles.rowTrailing}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.rowPressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

function TimeAdjuster({
  canDecrease,
  canIncrease,
  disabled,
  label,
  onDecrease,
  onIncrease,
  value,
}: TimeAdjusterProps) {
  const decreaseDisabled = disabled || !canDecrease;
  const increaseDisabled = disabled || !canIncrease;

  return (
    <View style={styles.timeAdjuster}>
      <Text style={styles.timeAdjusterLabel}>{label}</Text>
      <View style={styles.timeAdjusterControls}>
        <Pressable
          accessibilityLabel={`Make ${label.toLowerCase()} time earlier`}
          accessibilityRole="button"
          disabled={decreaseDisabled}
          hitSlop={6}
          onPress={onDecrease}
          style={({ pressed }) => [
            styles.timeAdjusterButton,
            decreaseDisabled && styles.timeAdjusterButtonDisabled,
            pressed && !decreaseDisabled && styles.timeAdjusterButtonPressed,
          ]}
        >
          <Text style={styles.timeAdjusterButtonText}>−</Text>
        </Pressable>

        <Text accessibilityLabel={`${label} ${value}`} style={styles.timeValue}>
          {value}
        </Text>

        <Pressable
          accessibilityLabel={`Make ${label.toLowerCase()} time later`}
          accessibilityRole="button"
          disabled={increaseDisabled}
          hitSlop={6}
          onPress={onIncrease}
          style={({ pressed }) => [
            styles.timeAdjusterButton,
            increaseDisabled && styles.timeAdjusterButtonDisabled,
            pressed && !increaseDisabled && styles.timeAdjusterButtonPressed,
          ]}
        >
          <Text style={styles.timeAdjusterButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatReminderTime(minutes: number): string {
  if (minutes === 24 * 60) {
    return 'Midnight';
  }

  const hours = Math.floor(minutes / 60);
  const displayHours = hours % 12 || 12;
  const displayMinutes = (minutes % 60).toString().padStart(2, '0');
  const period = hours < 12 ? 'AM' : 'PM';

  return `${displayHours}:${displayMinutes} ${period}`;
}

function notificationStatusFromPermissions(
  permissions: Notifications.NotificationPermissionsStatus,
): NotificationStatus {
  const iosStatus = permissions.ios?.status;

  if (
    permissions.granted ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  ) {
    return 'Enabled';
  }

  if (permissions.status === Notifications.PermissionStatus.UNDETERMINED) {
    return 'Not requested';
  }

  return 'Disabled';
}

export default function SettingsScreen() {
  const { advice, clearAdvice, isLoading } = useAdvice();
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationStatus>('Checking…');
  const [savedTimeRange, setSavedTimeRange] = useState<ReminderTimeRange>({
    ...DEFAULT_REMINDER_TIME_RANGE,
  });
  const [draftTimeRange, setDraftTimeRange] = useState<ReminderTimeRange>({
    ...DEFAULT_REMINDER_TIME_RANGE,
  });
  const [isTimeRangeLoading, setIsTimeRangeLoading] = useState(true);
  const [isSavingTimeRange, setIsSavingTimeRange] = useState(false);
  const [timeRangeMessage, setTimeRangeMessage] = useState('');
  const [timeRangeHasWarning, setTimeRangeHasWarning] = useState(false);
  const [remindersPaused, setRemindersPaused] = useState(false);
  const [isReminderPauseLoading, setIsReminderPauseLoading] = useState(true);
  const [isTogglingReminders, setIsTogglingReminders] = useState(false);
  const [reminderControlMessage, setReminderControlMessage] = useState('');
  const [reminderControlHasWarning, setReminderControlHasWarning] =
    useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const appVersion = Constants.expoConfig?.version ?? 'Unknown';
  const canClear = advice.length > 0 && !isLoading && !isClearing;
  const hasTimeRangeChanges =
    draftTimeRange.startMinutes !== savedTimeRange.startMinutes ||
    draftTimeRange.endMinutes !== savedTimeRange.endMinutes;
  const canSaveTimeRange =
    hasTimeRangeChanges &&
    !isTimeRangeLoading &&
    !isSavingTimeRange &&
    !isTogglingReminders;
  const canToggleReminders =
    !isReminderPauseLoading &&
    !isTogglingReminders &&
    !isSavingTimeRange;

  useEffect(() => {
    let isActive = true;

    async function hydrateReminderPreferences() {
      try {
        const [storedTimeRange, storedRemindersPaused] = await Promise.all([
          loadReminderTimeRange(),
          loadRemindersPaused(),
        ]);

        if (isActive) {
          setSavedTimeRange(storedTimeRange);
          setDraftTimeRange(storedTimeRange);
          setRemindersPaused(storedRemindersPaused);
        }
      } catch {
        if (isActive) {
          setTimeRangeHasWarning(true);
          setTimeRangeMessage(
            'The saved time range could not be loaded. The default is shown.',
          );
        }
      } finally {
        if (isActive) {
          setIsTimeRangeLoading(false);
          setIsReminderPauseLoading(false);
        }
      }
    }

    void hydrateReminderPreferences();

    return () => {
      isActive = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function refreshNotificationStatus() {
        if (Platform.OS === 'web') {
          if (isActive) {
            setNotificationStatus('Unavailable');
          }
          return;
        }

        try {
          const permissions = await Notifications.getPermissionsAsync();

          if (isActive) {
            setNotificationStatus(notificationStatusFromPermissions(permissions));
          }
        } catch {
          if (isActive) {
            setNotificationStatus('Unavailable');
          }
        }
      }

      void refreshNotificationStatus();

      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          void refreshNotificationStatus();
        }
      });

      return () => {
        isActive = false;
        subscription.remove();
      };
    }, []),
  );

  async function openSystemSettings() {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        'Could not open Settings',
        'Open the Settings app and select Unforget to manage its permissions.',
      );
    }
  }

  async function openWebPage(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Could not open Safari',
        'Check your internet connection and try again.',
      );
    }
  }

  function adjustStartTime(change: number) {
    setDraftTimeRange((currentRange) => ({
      ...currentRange,
      startMinutes: Math.max(
        0,
        Math.min(
          currentRange.startMinutes + change,
          currentRange.endMinutes - REMINDER_TIME_STEP_MINUTES,
        ),
      ),
    }));
    setTimeRangeMessage('');
    setTimeRangeHasWarning(false);
  }

  function adjustEndTime(change: number) {
    setDraftTimeRange((currentRange) => ({
      ...currentRange,
      endMinutes: Math.min(
        24 * 60,
        Math.max(
          currentRange.endMinutes + change,
          currentRange.startMinutes + REMINDER_TIME_STEP_MINUTES,
        ),
      ),
    }));
    setTimeRangeMessage('');
    setTimeRangeHasWarning(false);
  }

  async function persistTimeRange() {
    if (!canSaveTimeRange) {
      return;
    }

    const nextTimeRange = { ...draftTimeRange };

    setIsSavingTimeRange(true);
    setTimeRangeMessage('');
    setTimeRangeHasWarning(false);

    try {
      await saveReminderTimeRange(nextTimeRange);
      setSavedTimeRange(nextTimeRange);
    } catch {
      setTimeRangeHasWarning(true);
      setTimeRangeMessage('The reminder time range could not be saved.');
      setIsSavingTimeRange(false);
      return;
    }

    if (advice.length === 0) {
      setIsSavingTimeRange(false);
      return;
    }

    try {
      const result = await syncRandomNotifications(advice, false);

      if (result === 'scheduled') {
        setTimeRangeMessage('');
      } else if (result === 'paused') {
        setTimeRangeMessage('');
      } else if (result === 'permission-denied') {
        setTimeRangeHasWarning(true);
        setTimeRangeMessage(
          Platform.OS === 'ios'
            ? 'Time range saved, but notifications are disabled in iOS Settings.'
            : 'Time range saved, but notifications are disabled in app settings.',
        );
      } else {
        setTimeRangeMessage('Time range saved. Notifications are unavailable here.');
      }
    } catch {
      setTimeRangeHasWarning(true);
      setTimeRangeMessage(
        'Time range saved, but scheduled reminders could not be updated.',
      );
    } finally {
      setIsSavingTimeRange(false);
    }
  }

  async function toggleReminders() {
    if (!canToggleReminders) {
      return;
    }

    const nextPaused = !remindersPaused;

    setIsTogglingReminders(true);
    setReminderControlMessage('');
    setReminderControlHasWarning(false);

    try {
      await saveRemindersPaused(nextPaused);
      setRemindersPaused(nextPaused);
    } catch {
      setReminderControlHasWarning(true);
      setReminderControlMessage(
        nextPaused
          ? 'Reminders could not be paused.'
          : 'Reminders could not be resumed.',
      );
      setIsTogglingReminders(false);
      return;
    }

    try {
      const result = await syncRandomNotifications(advice, !nextPaused);

      if (nextPaused) {
        setReminderControlMessage('');
      } else if (result === 'scheduled') {
        setReminderControlMessage('');
      } else if (result === 'permission-denied') {
        setReminderControlHasWarning(true);
        setReminderControlMessage(
          Platform.OS === 'ios'
            ? 'Reminders are resumed, but notifications are disabled in iOS Settings.'
            : 'Reminders are resumed, but notifications are disabled in app settings.',
        );
      } else if (result === 'unsupported') {
        setReminderControlHasWarning(true);
        setReminderControlMessage(
          'Reminders are resumed, but notifications are unavailable here.',
        );
      }
    } catch {
      setReminderControlHasWarning(true);
      setReminderControlMessage(
        nextPaused
          ? 'Pause was saved, but existing scheduled reminders could not be cancelled.'
          : 'Reminders were resumed, but they could not be scheduled.',
      );
    } finally {
      setIsTogglingReminders(false);
    }
  }

  async function clearAllAdvice() {
    if (!canClear) {
      return;
    }

    setIsClearing(true);
    setErrorMessage('');

    try {
      await clearAdvice();
    } catch {
      setErrorMessage('Your advice could not be deleted. Please try again.');
    } finally {
      setIsClearing(false);
    }
  }

  function confirmClearAllAdvice() {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Settings</Text>
          <Text accessibilityElementsHidden style={styles.gear}>
            ⚙︎
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <View style={styles.timeRangeEditor}>
              <Text style={styles.timeRangeTitle}>Reminder time range</Text>
              <Text style={styles.timeRangeDescription}>
                Choose the earliest and latest time a daily reminder may appear.
              </Text>

              <View style={styles.timeAdjustersRow}>
                <TimeAdjuster
                  canDecrease={draftTimeRange.startMinutes > 0}
                  canIncrease={
                    draftTimeRange.startMinutes + REMINDER_TIME_STEP_MINUTES <
                    draftTimeRange.endMinutes
                  }
                  disabled={
                    isTimeRangeLoading ||
                    isSavingTimeRange ||
                    isTogglingReminders
                  }
                  label="From"
                  onDecrease={() =>
                    adjustStartTime(-REMINDER_TIME_STEP_MINUTES)
                  }
                  onIncrease={() => adjustStartTime(REMINDER_TIME_STEP_MINUTES)}
                  value={
                    isTimeRangeLoading
                      ? 'Loading…'
                      : formatReminderTime(draftTimeRange.startMinutes)
                  }
                />
                <TimeAdjuster
                  canDecrease={
                    draftTimeRange.endMinutes - REMINDER_TIME_STEP_MINUTES >
                    draftTimeRange.startMinutes
                  }
                  canIncrease={draftTimeRange.endMinutes < 24 * 60}
                  disabled={
                    isTimeRangeLoading ||
                    isSavingTimeRange ||
                    isTogglingReminders
                  }
                  label="Until"
                  onDecrease={() => adjustEndTime(-REMINDER_TIME_STEP_MINUTES)}
                  onIncrease={() => adjustEndTime(REMINDER_TIME_STEP_MINUTES)}
                  value={
                    isTimeRangeLoading
                      ? 'Loading…'
                      : formatReminderTime(draftTimeRange.endMinutes)
                  }
                />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canSaveTimeRange}
                onPress={() => {
                  void persistTimeRange();
                }}
                style={({ pressed }) => [
                  styles.saveTimeRangeButton,
                  !canSaveTimeRange && styles.saveTimeRangeButtonDisabled,
                  pressed && canSaveTimeRange && styles.saveTimeRangeButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.saveTimeRangeButtonText,
                    !canSaveTimeRange && styles.saveTimeRangeButtonTextDisabled,
                  ]}
                >
                  {isTimeRangeLoading
                    ? 'Loading…'
                    : isSavingTimeRange
                      ? 'Saving…'
                      : hasTimeRangeChanges
                        ? 'Save time range'
                        : 'Saved'}
                </Text>
              </Pressable>

              {timeRangeMessage ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.timeRangeMessage,
                    timeRangeHasWarning && styles.timeRangeMessageWarning,
                  ]}
                >
                  {timeRangeMessage}
                </Text>
              ) : null}

              <View style={styles.reminderControlDivider} />
              <View style={styles.reminderControlHeader}>
                <View style={styles.reminderControlCopy}>
                  <Text style={styles.reminderControlTitle}>Daily reminders</Text>
                  <Text style={styles.reminderControlDescription}>
                    {remindersPaused
                      ? 'No reminders will be scheduled.'
                      : 'Uses your saved advice.'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.reminderStateBadge,
                    remindersPaused && styles.reminderStateBadgePaused,
                  ]}
                >
                  <Text
                    style={[
                      styles.reminderStateBadgeText,
                      remindersPaused && styles.reminderStateBadgeTextPaused,
                    ]}
                  >
                    {isReminderPauseLoading
                      ? 'Loading…'
                      : remindersPaused
                        ? 'Paused'
                        : 'Active'}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canToggleReminders}
                onPress={() => {
                  void toggleReminders();
                }}
                style={({ pressed }) => [
                  styles.reminderControlButton,
                  remindersPaused && styles.reminderControlButtonResume,
                  !canToggleReminders && styles.reminderControlButtonDisabled,
                  pressed &&
                    canToggleReminders &&
                    styles.reminderControlButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.reminderControlButtonText,
                    remindersPaused && styles.reminderControlButtonTextResume,
                  ]}
                >
                  {isReminderPauseLoading
                    ? 'Loading…'
                    : isTogglingReminders
                      ? 'Updating…'
                      : remindersPaused
                        ? 'Resume reminders'
                        : 'Pause reminders'}
                </Text>
              </Pressable>

              {reminderControlMessage ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.reminderControlMessage,
                    reminderControlHasWarning &&
                      styles.reminderControlMessageWarning,
                  ]}
                >
                  {reminderControlMessage}
                </Text>
              ) : null}
            </View>
            <SettingsRow label="Notification status" value={notificationStatus} />
            <SettingsRow
              label={Platform.OS === 'ios' ? 'Open iOS Settings' : 'Open app settings'}
              onPress={() => {
                void openSystemSettings();
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.card}>
            <SettingsRow
              destructive
              disabled={!canClear}
              label={isClearing ? 'Deleting…' : 'Delete all saved advice'}
              onPress={confirmClearAllAdvice}
              value={
                isLoading
                  ? 'Loading…'
                  : advice.length === 0
                    ? 'No advice saved'
                    : `${advice.length} saved`
              }
            />
          </View>
          {errorMessage ? (
            <Text accessibilityLiveRegion="polite" style={styles.errorMessage}>
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL &amp; HELP</Text>
          <View style={styles.card}>
            <SettingsRow
              label="Privacy Policy"
              onPress={() => {
                void openWebPage(PRIVACY_URL);
              }}
            />
            <SettingsRow
              label="Support"
              onPress={() => {
                void openWebPage(SUPPORT_URL);
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <SettingsRow label="App version" value={appVersion} />
          </View>
        </View>
      </ScrollView>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 38,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 52,
    letterSpacing: -1.2,
    lineHeight: 58,
  },
  gear: {
    color: colors.accent,
    fontSize: 34,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 9,
    paddingHorizontal: 4,
    color: colors.muted,
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  card: {
    overflow: 'hidden',
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  timeRangeEditor: {
    padding: 17,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeRangeTitle: {
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  timeRangeDescription: {
    marginTop: 5,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  timeAdjustersRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  timeAdjuster: {
    flex: 1,
    gap: 7,
  },
  timeAdjusterLabel: {
    color: colors.muted,
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  timeAdjusterControls: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.canvas,
  },
  timeAdjusterButton: {
    width: 34,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeAdjusterButtonDisabled: {
    opacity: 0.28,
  },
  timeAdjusterButtonPressed: {
    backgroundColor: colors.accentSoft,
  },
  timeAdjusterButtonText: {
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 19,
  },
  timeValue: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    textAlign: 'center',
  },
  saveTimeRangeButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: 19,
    backgroundColor: colors.ink,
  },
  saveTimeRangeButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveTimeRangeButtonPressed: {
    opacity: 0.84,
  },
  saveTimeRangeButtonText: {
    color: colors.surface,
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
  },
  saveTimeRangeButtonTextDisabled: {
    color: colors.muted,
  },
  timeRangeMessage: {
    marginTop: 10,
    color: colors.positive,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  timeRangeMessageWarning: {
    color: colors.negative,
  },
  reminderControlDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    backgroundColor: colors.line,
  },
  reminderControlHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  reminderControlCopy: {
    flex: 1,
  },
  reminderControlTitle: {
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  reminderControlDescription: {
    marginTop: 5,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  reminderStateBadge: {
    minHeight: 25,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
  },
  reminderStateBadgePaused: {
    backgroundColor: colors.disabled,
  },
  reminderStateBadgeText: {
    color: colors.ink,
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
  },
  reminderStateBadgeTextPaused: {
    color: colors.muted,
  },
  reminderControlButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderColor: colors.line,
    borderRadius: 19,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  reminderControlButtonResume: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  reminderControlButtonDisabled: {
    opacity: 0.42,
  },
  reminderControlButtonPressed: {
    opacity: 0.82,
  },
  reminderControlButtonText: {
    color: colors.negative,
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
  },
  reminderControlButtonTextResume: {
    color: colors.surface,
  },
  reminderControlMessage: {
    marginTop: 10,
    color: colors.positive,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  reminderControlMessageWarning: {
    color: colors.negative,
  },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 17,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    backgroundColor: colors.accentSoft,
  },
  rowLabel: {
    flexShrink: 1,
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowValue: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  chevron: {
    marginTop: -2,
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 24,
  },
  destructiveText: {
    color: colors.negative,
  },
  disabledText: {
    color: colors.faint,
  },
  errorMessage: {
    marginTop: 10,
    paddingHorizontal: 4,
    color: colors.negative,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
});
