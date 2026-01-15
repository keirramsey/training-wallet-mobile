import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
import { colors, radii, shadows, spacing } from '@/src/theme/tokens';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Sign out from Training Wallet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const expiresAt = session?.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'Unknown';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Security</Text>
          <Text style={styles.body}>
            Update your password and security settings through Search Training.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Auth Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Signed in as</Text>
            <Text style={styles.value}>{session?.userId ?? 'Signed out'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Org</Text>
            <Text style={styles.value}>{session?.orgId ?? 'Not set'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Roles</Text>
            <Text style={styles.value}>{session?.roles?.length ? session.roles.join(', ') : 'None'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Expires</Text>
            <Text style={styles.value}>{expiresAt}</Text>
          </View>
          <Pressable
            onPress={handleLogout}
            disabled={!session || isLoading}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && !isLoading && styles.signOutButtonPressed,
              (!session || isLoading) && styles.signOutButtonDisabled,
            ]}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  row: {
    marginTop: spacing.xs,
  },
  label: {
    fontSize: 12,
    color: colors.text.muted,
  },
  value: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: spacing.md,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  signOutButtonPressed: {
    backgroundColor: colors.bg.surfaceMuted,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  backButton: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  backButtonPressed: {
    backgroundColor: colors.bg.surfaceMuted,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
