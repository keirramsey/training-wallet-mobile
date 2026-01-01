import { useThemePreference } from '@/src/context/ThemePreferenceContext';

export function useColorScheme() {
  const { resolvedScheme } = useThemePreference();
  return resolvedScheme;
}
