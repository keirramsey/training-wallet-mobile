import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform secure storage abstraction.
 * Uses expo-secure-store on native platforms (iOS/Android)
 * Falls back to localStorage on web (with warning for sensitive data)
 */

const isWeb = Platform.OS === 'web';

// Log once when web fallback is used
let webFallbackWarned = false;
function warnWebFallback() {
  if (isWeb && !webFallbackWarned) {
    console.warn(
      '[secureStorage] Using localStorage on web. For production, consider more secure alternatives.'
    );
    webFallbackWarned = true;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (isWeb) {
    warnWebFallback();
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('[secureStorage] localStorage.setItem failed:', e);
      throw e;
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItemAsync(key: string): Promise<string | null> {
  if (isWeb) {
    warnWebFallback();
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('[secureStorage] localStorage.getItem failed:', e);
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (isWeb) {
    warnWebFallback();
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[secureStorage] localStorage.removeItem failed:', e);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
