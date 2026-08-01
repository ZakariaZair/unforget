import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { loadAdvice, saveAdvice } from '../lib/advice-storage';
import {
  NotificationScheduleResult,
  syncRandomNotifications,
} from '../lib/notifications';
import {
  Advice,
  MAX_ADVICE_COUNT,
  MAX_ADVICE_LENGTH,
} from '../types/advice';

type AddAdviceResult = {
  notificationResult: NotificationScheduleResult | 'error';
};

type AdviceContextValue = {
  advice: Advice[];
  addAdvice: (text: string) => Promise<AddAdviceResult>;
  clearAdvice: () => Promise<void>;
  deleteAdvice: (id: string) => Promise<void>;
  isLoading: boolean;
};

type AdviceProviderProps = {
  children: ReactNode;
};

const AdviceContext = createContext<AdviceContextValue | null>(null);

export class AdviceLimitError extends Error {
  constructor() {
    super(`You can save up to ${MAX_ADVICE_COUNT} pieces of advice.`);
    this.name = 'AdviceLimitError';
  }
}

function createAdvice(text: string): Advice {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    text,
    createdAt: new Date().toISOString(),
  };
}

export function AdviceProvider({ children }: AdviceProviderProps) {
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function hydrateAdvice() {
      try {
        const storedAdvice = await loadAdvice();

        if (!isMounted) {
          return;
        }

        setAdvice(storedAdvice);

        if (storedAdvice.length > 0) {
          void syncRandomNotifications(storedAdvice, false).catch((error: unknown) => {
            console.warn('Could not refresh advice notifications.', error);
          });
        }
      } catch (error) {
        console.warn('Could not load saved advice.', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void hydrateAdvice();

    return () => {
      isMounted = false;
    };
  }, []);

  const addAdvice = useCallback(
    async (text: string): Promise<AddAdviceResult> => {
      const normalizedText = text.trim();

      if (
        normalizedText.length === 0 ||
        normalizedText.length > MAX_ADVICE_LENGTH
      ) {
        throw new Error(
          `Advice must contain between 1 and ${MAX_ADVICE_LENGTH} characters.`,
        );
      }

      if (advice.length >= MAX_ADVICE_COUNT) {
        throw new AdviceLimitError();
      }

      const nextAdvice = [createAdvice(normalizedText), ...advice];

      await saveAdvice(nextAdvice);
      setAdvice(nextAdvice);

      try {
        const notificationResult = await syncRandomNotifications(nextAdvice, true);
        return { notificationResult };
      } catch (error) {
        console.warn('Advice was saved, but notifications could not be scheduled.', error);
        return { notificationResult: 'error' };
      }
    },
    [advice],
  );

  const deleteAdvice = useCallback(
    async (id: string): Promise<void> => {
      const nextAdvice = advice.filter((item) => item.id !== id);

      if (nextAdvice.length === advice.length) {
        return;
      }

      await saveAdvice(nextAdvice);
      setAdvice(nextAdvice);

      try {
        await syncRandomNotifications(nextAdvice, false);
      } catch (error) {
        console.warn(
          'Advice was deleted, but notifications could not be refreshed.',
          error,
        );
      }
    },
    [advice],
  );

  const clearAdvice = useCallback(async (): Promise<void> => {
    await saveAdvice([]);
    setAdvice([]);

    try {
      await syncRandomNotifications([], false);
    } catch (error) {
      console.warn(
        'Advice was cleared, but notifications could not be cancelled.',
        error,
      );
    }
  }, []);

  const value = useMemo(
    () => ({ advice, addAdvice, clearAdvice, deleteAdvice, isLoading }),
    [advice, addAdvice, clearAdvice, deleteAdvice, isLoading],
  );

  return <AdviceContext.Provider value={value}>{children}</AdviceContext.Provider>;
}

export function useAdvice(): AdviceContextValue {
  const context = useContext(AdviceContext);

  if (!context) {
    throw new Error('useAdvice must be used inside AdviceProvider.');
  }

  return context;
}
