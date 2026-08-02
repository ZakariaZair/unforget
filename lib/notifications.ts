import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Advice } from '../types/advice';
import {
  loadReminderTimeRange,
  ReminderTimeRange,
} from './reminder-time-range';
import { loadRemindersPaused } from './reminder-pause';

const ANDROID_CHANNEL_ID = 'daily-advice';
const MANAGED_NOTIFICATION_IDS_KEY = '@unforget/notification-ids/v1';
const SCHEDULE_LENGTH_DAYS = 30;

export type NotificationScheduleResult =
  | 'scheduled'
  | 'paused'
  | 'permission-denied'
  | 'unsupported';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function notificationsAreAllowed(
  permissions: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Daily advice',
    description: 'Advice you saved in Unforget.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

async function getPermission(requestIfNeeded: boolean): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  await configureAndroidChannel();

  let permissions = await Notifications.getPermissionsAsync();

  if (
    !notificationsAreAllowed(permissions) &&
    requestIfNeeded &&
    permissions.canAskAgain
  ) {
    permissions = await Notifications.requestPermissionsAsync();
  }

  return notificationsAreAllowed(permissions);
}

async function loadManagedNotificationIds(): Promise<string[]> {
  const storedValue = await AsyncStorage.getItem(MANAGED_NOTIFICATION_IDS_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

async function cancelManagedNotifications(): Promise<void> {
  const identifiers = await loadManagedNotificationIds();

  await Promise.allSettled(
    identifiers.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
  await AsyncStorage.setItem(MANAGED_NOTIFICATION_IDS_KEY, JSON.stringify([]));
}

function getRandomAdvice(advice: Advice[]): Advice {
  return advice[Math.floor(Math.random() * advice.length)];
}

function getRandomDaytimeDate(
  dayOffset: number,
  timeRange: ReminderTimeRange,
): Date {
  const date = new Date();
  const availableMinutes = timeRange.endMinutes - timeRange.startMinutes;
  const reminderMinute =
    timeRange.startMinutes + Math.floor(Math.random() * availableMinutes);

  date.setDate(date.getDate() + dayOffset);
  date.setHours(
    Math.floor(reminderMinute / 60),
    reminderMinute % 60,
    0,
    0,
  );

  return date;
}

function getChannelAwareTrigger<T extends object>(trigger: T): T & { channelId?: string } {
  if (Platform.OS === 'android') {
    return { ...trigger, channelId: ANDROID_CHANNEL_ID };
  }

  return trigger;
}

async function replaceRandomNotifications(
  advice: Advice[],
  requestPermission: boolean,
): Promise<NotificationScheduleResult> {
  if (Platform.OS === 'web') {
    return 'unsupported';
  }

  if (advice.length === 0) {
    await cancelManagedNotifications();
    return 'scheduled';
  }

  const remindersPaused = await loadRemindersPaused();

  if (remindersPaused) {
    await cancelManagedNotifications();
    return 'paused';
  }

  const hasPermission = await getPermission(requestPermission);

  if (!hasPermission) {
    return 'permission-denied';
  }

  const timeRange = await loadReminderTimeRange();

  await cancelManagedNotifications();

  const scheduledIdentifiers: string[] = [];

  try {
    for (let dayOffset = 1; dayOffset <= SCHEDULE_LENGTH_DAYS; dayOffset += 1) {
      const selectedAdvice = getRandomAdvice(advice);
      const trigger: Notifications.DateTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: getRandomDaytimeDate(dayOffset, timeRange),
      };
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Something worth remembering',
          body: selectedAdvice.text,
          data: {
            adviceId: selectedAdvice.id,
            kind: 'daily-advice',
          },
          sound: 'default',
        },
        trigger: getChannelAwareTrigger(trigger),
      });

      scheduledIdentifiers.push(identifier);
    }
  } finally {
    await AsyncStorage.setItem(
      MANAGED_NOTIFICATION_IDS_KEY,
      JSON.stringify(scheduledIdentifiers),
    );
  }

  return 'scheduled';
}

let notificationSyncQueue: Promise<NotificationScheduleResult> = Promise.resolve(
  'scheduled',
);

export function syncRandomNotifications(
  advice: Advice[],
  requestPermission: boolean,
): Promise<NotificationScheduleResult> {
  const nextSync = notificationSyncQueue
    .catch(() => 'scheduled' as const)
    .then(() => replaceRandomNotifications(advice, requestPermission));

  notificationSyncQueue = nextSync;
  return nextSync;
}

export async function scheduleTestNotification(
  advice: Advice[],
): Promise<NotificationScheduleResult> {
  if (Platform.OS === 'web') {
    return 'unsupported';
  }

  const remindersPaused = await loadRemindersPaused();

  if (remindersPaused) {
    return 'paused';
  }

  const hasPermission = await getPermission(true);

  if (!hasPermission) {
    return 'permission-denied';
  }

  const selectedAdvice = getRandomAdvice(advice);
  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 2,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Something worth remembering',
      body: selectedAdvice.text,
      data: {
        adviceId: selectedAdvice.id,
        kind: 'test-advice',
      },
      sound: 'default',
    },
    trigger: getChannelAwareTrigger(trigger),
  });

  return 'scheduled';
}
