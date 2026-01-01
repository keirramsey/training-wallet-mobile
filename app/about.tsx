import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, radii, shadows, spacing } from '@/src/theme/tokens';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>About Training Wallet</Text>
          <Text style={styles.body}>
            Training Wallet helps you store, verify, and renew your credentials with Search Training.
          </Text>
          <Text style={styles.meta}>Version 1.0.0</Text>
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  meta: {
    marginTop: spacing.md,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
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
