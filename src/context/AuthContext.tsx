import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';

import type { AuthSessionState } from '@/src/auth/auth';
import { getSession, signIn as authSignIn, signOut as authSignOut } from '@/src/auth/auth';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSessionState | null;
};

type AuthContextValue = AuthState & {
  signIn: () => Promise<void>;
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
    session: null,
  });

  // Restore auth state on mount
  useEffect(() => {
    async function restore() {
      try {
        const session = await getSession();
        if (session) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            session,
          });
          return;
        }

        // No valid session
        setState({
          isAuthenticated: false,
          isLoading: false,
          session: null,
        });
      } catch {
        setState({
          isAuthenticated: false,
          isLoading: false,
          session: null,
        });
      }
    }

    void restore();
  }, []);

  // Enable route protection
  useProtectedRoute(state.isAuthenticated, state.isLoading);

  const signIn = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const session = await authSignIn();
      setState({
        isAuthenticated: true,
        isLoading: false,
        session,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authSignOut();
    } finally {
      setState({
        isAuthenticated: false,
        isLoading: false,
        session: null,
      });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      logout,
    }),
    [state, signIn, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
