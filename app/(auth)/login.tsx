import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
import { colors, shadows, spacing } from '@/src/theme/tokens';

// Wallet Icon (matching mockup)
const WalletIcon = ({ size = 64 }: { size?: number }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="16" rx="2" fill={colors.primary} />
      <Rect x="14" y="11" width="6" height="4" rx="1" fill="white" />
      <Path d="M6 5V3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke={colors.primary} strokeWidth="2" />
    </Svg>
  </View>
);

// Search Training Badge
const STBadge = () => (
  <LinearGradient
    colors={['#a855f7', '#ec4899']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.stBadge}
  >
    <Text style={styles.stBadgeText}>ST</Text>
  </LinearGradient>
);

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter email and password');
      return;
    }

    setLoginError(null);
    try {
      await login({ email: email.trim(), password });
      // Navigation is handled by AuthContext route protection
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setLoginError(message);
      Alert.alert('Login Failed', message);
    }
  };

  const onForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const onSearchTrainingLogin = async () => {
    // For demo purposes, use email/password login with demo credentials
    setLoginError(null);
    try {
      await login({ email: 'demo@example.com', password: 'demo123' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SSO login failed';
      setLoginError(message);
      Alert.alert('SSO Login Failed', message);
    }
  };

  const onSignUp = () => {
    router.push('/(auth)/signup');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <WalletIcon size={64} />
          <Text style={styles.title}>Access your Training Wallet</Text>
          <Text style={styles.subtitle}>
            Securely store, verify, and renew your professional credentials.
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel} nativeID="email-label">Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="user@example.com"
              placeholderTextColor={colors.input.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address to log in"
              accessibilityLabelledBy="email-label"
              textContentType="emailAddress"
            />
          </View>

          {/* Password Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel} nativeID="password-label">Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={colors.input.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                accessibilityLabel="Password"
                accessibilityHint="Enter your password to log in"
                accessibilityLabelledBy="password-label"
                textContentType="password"
              />
              <Pressable
                onPress={togglePasswordVisibility}
                style={styles.visibilityButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <FontAwesome5
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={20}
                  color={colors.input.placeholder}
                />
              </Pressable>
            </View>
            <Pressable
              onPress={onForgotPassword}
              style={styles.forgotPasswordContainer}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Error Message */}
          {loginError && (
            <Text style={styles.errorText}>{loginError}</Text>
          )}

          {/* Login Button */}
          <Pressable
            onPress={onLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && !isLoading && styles.loginButtonPressed,
              isLoading && styles.loginButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Search Training Login */}
        <Pressable
          onPress={onSearchTrainingLogin}
          style={({ pressed }) => [
            styles.stButton,
            pressed && styles.stButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Log in with Search Training account"
        >
          <STBadge />
          <Text style={styles.stButtonText}>Search Training Account</Text>
        </Pressable>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Text style={styles.signUpLink} onPress={onSignUp}>
            Sign up
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.input.placeholder,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  form: {
    width: '100%',
    gap: spacing.md,
  },
  fieldContainer: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: colors.text.primary,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50,
  },
  visibilityButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 56,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    paddingTop: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...shadows.soft,
  },
  loginButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.input.border,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.input.placeholder,
    paddingHorizontal: spacing.xs,
  },
  stButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stButtonPressed: {
    backgroundColor: colors.bg.surfaceMuted,
    transform: [{ scale: 0.98 }],
  },
  stBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  stButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.bg.surface,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.input.placeholder,
    textAlign: 'center',
  },
  signUpLink: {
    fontWeight: '600',
    color: colors.primary,
  },
});
