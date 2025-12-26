import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantChat } from '@/components/assistant/AssistantChat';
import {
  DEFAULT_QUICK_ACTIONS,
  resolveAssistantIntent,
  type AssistantAction,
} from '@/services/assistant/intents';
import { getLocalCredentials } from '@/src/storage/credentialsStore';
import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';

export default function AssistantModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleResolve = useCallback(
    async (message: string) =>
      resolveAssistantIntent(message, {
        getCredentials: getLocalCredentials,
      }),
    []
  );

  const handleAction = useCallback(async (action: AssistantAction) => {
    if (action.type !== 'open_url') return;
    if (Platform.OS === 'web') {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(action.url);
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={[colors.brand.cyan, colors.brand.blue]} style={styles.iconBadge}>
              <FontAwesome name="commenting" size={18} color={colors.text.inverse} />
            </LinearGradient>
            <View>
              <Text style={styles.title}>TW Assistant</Text>
              <Text style={styles.status}>Private - On-device</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close assistant"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed ? styles.closeButtonPressed : null]}
          >
            <FontAwesome name="close" size={16} color={colors.text.primary} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <AssistantChat
            intro="Hi! I can help with expiring tickets, directions to your next booking, or booking a refresher."
            quickActions={DEFAULT_QUICK_ACTIONS}
            onResolve={handleResolve}
            onAction={handleAction}
            footerText="Answers are generated on-device and never leave your wallet."
            bottomInset={insets.bottom}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '900',
    color: colors.text.primary,
  },
  status: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  body: {
    flex: 1,
  },
});
