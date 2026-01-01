import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, radii, shadows, spacing } from '@/src/theme/tokens';

export default function PersonalInfoScreen() {
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
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.body}>
            Manage your profile details in Search Training to keep your wallet up to date.
          </Text>
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
