import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedScheme: 'light' | 'dark';
  setPreference: (next: ThemePreference) => void;
  isLoading: boolean;
};

const STORAGE_KEY = '@training_wallet/theme_preference';

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return context;
}

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          if (isMounted) setPreferenceState(stored);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadPreference();
    return () => {
      isMounted = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const resolvedScheme = useMemo<'light' | 'dark'>(() => {
    if (preference === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
    return preference;
  }, [preference, systemScheme]);

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      setPreference,
      isLoading,
    }),
    [preference, resolvedScheme, setPreference, isLoading]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}
