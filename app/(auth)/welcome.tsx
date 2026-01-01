import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { colors, radii, shadows, spacing } from '@/src/theme/tokens';

// Hero illustration with 3D cards (simplified SVG version)
const HeroIllustration = () => (
  <View style={styles.heroContainer}>
    <Image
      source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUlt4nyHKHneEBEBKItJacFhh4qcgVFctQBDJraSeoIzEvX75G0HkQx81Fr4fGM-Ur4O3CRTyTGqoWXBoLW672yOBOy-2hA-CpSPGSZbG5qj8NrP6Yz-6HL4MX713ULI62R9IphnFnQlRp0MriTvSikirJjk5SQW2NOJK-iDek7PMQlFx0m3ky-SBsm5BmR7OaEtIxt8XoFaG0gGOqIZuEUfYK6qHAtk3mJzRLNXvpMxUak5Ye66Q9ChpWDo1FMfwq3GQhGJF0RKg' }}
      style={styles.heroImage}
      resizeMode="contain"
    />
  </View>
);

// Verified badge icon
const VerifiedIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"
      fill={colors.primary}
    />
  </Svg>
);

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const onGetStarted = () => {
    router.push('/(auth)/login');
  };

  const onLogin = () => {
    router.push('/(auth)/login');
  };

  const onWhatIs = () => {
    // Could open a modal or web link
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Hero Section */}
        <HeroIllustration />

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>
            Welcome to{'\n'}
            <Text style={styles.titleHighlight}>Training Wallet</Text>
          </Text>
          <Text style={styles.subtitle}>
            Store, verify, and renew your training credentials.
          </Text>

          {/* Powered By Badge */}
          <View style={styles.poweredBy}>
            <VerifiedIcon size={18} />
            <Text style={styles.poweredByText}>POWERED BY SEARCH TRAINING</Text>
          </View>
        </View>
      </View>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Get Started Button (Primary) */}
        <Pressable
          onPress={onGetStarted}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        {/* Log In Button (Secondary) */}
        <Pressable
          onPress={onLogin}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Log in"
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </Pressable>

        {/* What Is Link */}
        <Pressable
          onPress={onWhatIs}
          style={styles.linkContainer}
          accessibilityRole="link"
          accessibilityLabel="What is Training Wallet"
        >
          <Text style={styles.linkText}>What is Training Wallet?</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.auth,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  heroContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 420,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 38,
  },
  titleHighlight: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    opacity: 0.8,
  },
  poweredByText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.bg.surfaceMuted,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  linkContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
  },
});
