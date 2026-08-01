import AsyncStorage from '@react-native-async-storage/async-storage';

import { Advice, MAX_ADVICE_COUNT, MAX_ADVICE_LENGTH } from '../types/advice';

const ADVICE_STORAGE_KEY = '@unforget/advice/v1';

function isAdvice(value: unknown): value is Advice {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Advice>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.text === 'string' &&
    candidate.text.trim().length > 0 &&
    candidate.text.length <= MAX_ADVICE_LENGTH &&
    typeof candidate.createdAt === 'string'
  );
}

export async function loadAdvice(): Promise<Advice[]> {
  const storedValue = await AsyncStorage.getItem(ADVICE_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isAdvice).slice(0, MAX_ADVICE_COUNT);
  } catch {
    return [];
  }
}

export async function saveAdvice(advice: Advice[]): Promise<void> {
  if (advice.length > MAX_ADVICE_COUNT) {
    throw new Error(`Cannot store more than ${MAX_ADVICE_COUNT} pieces of advice.`);
  }

  await AsyncStorage.setItem(ADVICE_STORAGE_KEY, JSON.stringify(advice));
}
