import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_PAUSED_KEY = '@unforget/reminders-paused/v1';

export async function loadRemindersPaused(): Promise<boolean> {
  const storedValue = await AsyncStorage.getItem(REMINDERS_PAUSED_KEY);

  if (!storedValue) {
    return false;
  }

  try {
    return JSON.parse(storedValue) === true;
  } catch {
    return false;
  }
}

export async function saveRemindersPaused(isPaused: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_PAUSED_KEY, JSON.stringify(isPaused));
}
