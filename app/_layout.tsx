import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';

import { AuthProvider } from '@/src/context/AuthContext';
import { ThemePreferenceProvider, useThemePreference } from '@/src/context/ThemePreferenceContext';
import { API_BASE_URL } from '@/src/lib/api';
import { colors, shadows } from '@/src/theme/tokens';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    ...FontAwesome5.font,
  });

  useEffect(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info('[Training Wallet Mobile] API_BASE_URL:', API_BASE_URL);
    }
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemePreferenceProvider>
      <RootLayoutNav />
    </ThemePreferenceProvider>
  );
}

function RootLayoutNav() {
  const { resolvedScheme } = useThemePreference();
  const window = useWindowDimensions();

  const content = (
    <AuthProvider>
      <ThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="credential/[id]" options={{ title: 'Credential' }} />
          <Stack.Screen name="add/upload" options={{ title: 'Upload' }} />
          <Stack.Screen name="add/manual" options={{ title: 'Manual entry' }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );

  if (Platform.OS !== 'web') return content;

  return (
    <View style={[styles.webOuter, { minHeight: window.height }]}>
      <View style={[styles.webFrame, { minHeight: window.height }]}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create<{ webOuter: ViewStyle; webFrame: ViewStyle }>({
  webOuter: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.bg.app,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.10)',
    ...shadows.soft,
  },
});
