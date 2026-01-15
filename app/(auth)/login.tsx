import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { useAuth } from '@/src/context/AuthContext';
import { colors, shadows, spacing } from '@/src/theme/tokens';

const WalletIcon = ({ size = 64 }: { size?: number }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="16" rx="2" fill={colors.primary} />
      <Rect x="14" y="11" width="6" height="4" rx="1" fill="white" />
      <Path d="M6 5V3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke={colors.primary} strokeWidth="2" />
    </Svg>
  </View>
);

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
  const { signIn, isLoading } = useAuth();

  const onSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-in failed';
      Alert.alert('Sign-in failed', message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <WalletIcon size={64} />
          <Text style={styles.title}>Access your Training Wallet</Text>
          <Text style={styles.subtitle}>
            Sign in securely through Search Training to access your credentials.
          </Text>
          <View style={styles.badgeRow}>
            <STBadge />
            <Text style={styles.badgeText}>Powered by Search Training</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onSignIn}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.signInButton,
              pressed && !isLoading && styles.signInButtonPressed,
              isLoading && styles.signInButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Cognito"
          >
            <Text style={styles.signInButtonText}>
              {isLoading ? 'Opening sign-in...' : 'Sign in with Cognito'}
            </Text>
          </Pressable>
          <Text style={styles.helpText}>Need help? support@trainingwallet.com.au</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.auth,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  stBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stBadgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  actions: {
    gap: spacing.md,
  },
  signInButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  signInButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: 12,
  },
});
