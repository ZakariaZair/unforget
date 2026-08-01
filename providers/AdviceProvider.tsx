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
import { Advice } from '../types/advice';

type AddAdviceResult = {
  notificationResult: NotificationScheduleResult | 'error';
};

type AdviceContextValue = {
  advice: Advice[];
  addAdvice: (text: string) => Promise<AddAdviceResult>;
  isLoading: boolean;
};

type AdviceProviderProps = {
  children: ReactNode;
};

const AdviceContext = createContext<AdviceContextValue | null>(null);

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

      if (normalizedText.length === 0 || normalizedText.length > 100) {
        throw new Error('Advice must contain between 1 and 100 characters.');
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

  const value = useMemo(
    () => ({ advice, addAdvice, isLoading }),
    [advice, addAdvice, isLoading],
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
