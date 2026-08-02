import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_TIME_RANGE_KEY = '@unforget/reminder-time-range/v1';
const MINUTES_PER_DAY = 24 * 60;

export const REMINDER_TIME_STEP_MINUTES = 30;

export type ReminderTimeRange = {
  startMinutes: number;
  endMinutes: number;
};

export const DEFAULT_REMINDER_TIME_RANGE: ReminderTimeRange = {
  startMinutes: 9 * 60,
  endMinutes: 21 * 60,
};

function isValidReminderTimeRange(value: unknown): value is ReminderTimeRange {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ReminderTimeRange>;

  return (
    Number.isInteger(candidate.startMinutes) &&
    Number.isInteger(candidate.endMinutes) &&
    typeof candidate.startMinutes === 'number' &&
    typeof candidate.endMinutes === 'number' &&
    candidate.startMinutes >= 0 &&
    candidate.endMinutes <= MINUTES_PER_DAY &&
    candidate.endMinutes - candidate.startMinutes >= REMINDER_TIME_STEP_MINUTES
  );
}

export async function loadReminderTimeRange(): Promise<ReminderTimeRange> {
  const storedValue = await AsyncStorage.getItem(REMINDER_TIME_RANGE_KEY);

  if (!storedValue) {
    return { ...DEFAULT_REMINDER_TIME_RANGE };
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return isValidReminderTimeRange(parsedValue)
      ? parsedValue
      : { ...DEFAULT_REMINDER_TIME_RANGE };
  } catch {
    return { ...DEFAULT_REMINDER_TIME_RANGE };
  }
}

export async function saveReminderTimeRange(
  timeRange: ReminderTimeRange,
): Promise<void> {
  if (!isValidReminderTimeRange(timeRange)) {
    throw new Error('The reminder time range is invalid.');
  }

  await AsyncStorage.setItem(REMINDER_TIME_RANGE_KEY, JSON.stringify(timeRange));
}
