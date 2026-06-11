/** Tiny toast: one message at a time, slides up from the bottom, friendly. */
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

type ToastKind = 'error' | 'success';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  show(message: string, kind?: ToastKind): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, kind: ToastKind = 'error') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      <View className="flex-1">
        {children}
        {toast && (
          <Animated.View
            key={toast.id}
            entering={SlideInDown.springify().damping(18)}
            exiting={SlideOutDown}
            className="absolute bottom-24 left-6 right-6 items-center"
            pointerEvents="none"
          >
            <View
              className={`rounded-bubble px-5 py-3 shadow-lg ${
                toast.kind === 'error' ? 'bg-coral' : 'bg-mint'
              }`}
            >
              <Text className="font-sans-bold text-base text-white">{toast.message}</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
