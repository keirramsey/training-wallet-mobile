import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';

import type { AuthState, LoginCredentials } from '@/src/lib/auth';
import {
  getStoredToken,
  getStoredUser,
  login as authLogin,
  loginWithSearchTraining as authLoginWithSSO,
  logout as authLogout,
  validateToken,
} from '@/src/lib/auth';

type AuthContextValue = AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithSearchTraining: (ssoToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to protect routes based on auth state
 */
function useProtectedRoute(isAuthenticated: boolean, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to welcome screen if not authenticated
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to wallet if already authenticated
      router.replace('/(tabs)/wallet');
    }
  }, [isAuthenticated, isLoading, segments, router]);
}

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
  });

  // Restore auth state on mount
  useEffect(() => {
    async function restore() {
      try {
        const [token, user] = await Promise.all([getStoredToken(), getStoredUser()]);

        if (token && user) {
          // Optionally validate token with server
          const isValid = await validateToken(token).catch(() => false);

          if (isValid) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              user,
              token,
            });
            return;
          }
        }

        // No valid session
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
        });
      } catch {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
        });
      }
    }

    void restore();
  }, []);

  // Enable route protection
  useProtectedRoute(state.isAuthenticated, state.isLoading);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authLogin(credentials);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        token: response.token,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const loginWithSearchTraining = useCallback(async (ssoToken: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authLoginWithSSO(ssoToken);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        token: response.token,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authLogout();
    } finally {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      loginWithSearchTraining,
      logout,
    }),
    [state, login, loginWithSearchTraining, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
