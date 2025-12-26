import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AssistantAction, AssistantQuickAction, AssistantResponse } from '@/services/assistant/intents';
import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

type AssistantChatProps = {
  intro: string;
  quickActions: AssistantQuickAction[];
  onResolve: (message: string) => Promise<AssistantResponse>;
  onAction?: (action: AssistantAction) => void | Promise<void>;
  placeholder?: string;
  footerText?: string;
  bottomInset?: number;
};

const MIN_TYPING_DELAY = 500;
const MAX_TYPING_DELAY = 900;

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AssistantChat({
  intro,
  quickActions,
  onResolve,
  onAction,
  placeholder = 'Ask about your tickets...',
  footerText,
  bottomInset = 0,
}: AssistantChatProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isTyping) return;

      setMessages((prev) => [...prev, { id: createId('user'), role: 'user', text: trimmed }]);
      setInput('');
      setIsTyping(true);

      try {
        const delay =
          MIN_TYPING_DELAY + Math.floor(Math.random() * (MAX_TYPING_DELAY - MIN_TYPING_DELAY + 1));
        const [response] = await Promise.all([onResolve(trimmed), wait(delay)]);
        setMessages((prev) => [...prev, { id: createId('assistant'), role: 'assistant', text: response.message }]);
        if (response.action && onAction) {
          await onAction(response.action);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: createId('assistant'), role: 'assistant', text: 'Sorry, something went wrong.' },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, onResolve, onAction]
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isTyping]);

  const canSend = input.trim().length > 0 && !isTyping;
  const actionRow = useMemo(
    () =>
      quickActions.map((action) => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          onPress={() => sendMessage(action.message)}
          style={({ pressed }) => [styles.chip, pressed ? styles.chipPressed : null]}
        >
          <Text style={styles.chipText}>{action.label}</Text>
        </Pressable>
      )),
    [quickActions, sendMessage]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.dayDivider}>
          <View style={styles.dayDividerLine} />
          <Text style={styles.dayDividerText}>Today</Text>
          <View style={styles.dayDividerLine} />
        </View>

        <View style={styles.messageRow}>
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Text style={styles.assistantText}>{intro}</Text>
          </View>
        </View>

        <View style={styles.chipRow}>{actionRow}</View>

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.messageRow, msg.role === 'user' ? styles.messageRowRight : null]}
          >
            <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>{msg.text}</Text>
            </View>
          </View>
        ))}

        {isTyping ? (
          <View style={styles.messageRow}>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <Text style={styles.typingText}>Typing...</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.inputWrap, { paddingBottom: spacing.sm + bottomInset }]}>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={placeholder}
            placeholderTextColor={colors.text.muted}
            style={styles.input}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => sendMessage(input)}
            style={({ pressed }) => [
              styles.sendButton,
              !canSend ? styles.sendButtonDisabled : null,
              pressed && canSend ? styles.sendButtonPressed : null,
            ]}
            disabled={!canSend}
          >
            <FontAwesome name="paper-plane" size={14} color={colors.text.inverse} />
          </Pressable>
        </View>
        {footerText ? <Text style={styles.footerText}>{footerText}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  dayDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  dayDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dayDividerText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '84%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  assistantBubble: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: {
    backgroundColor: colors.brand.blue,
    borderWidth: 1,
    borderColor: 'rgba(14,137,186,0.5)',
  },
  assistantText: {
    color: colors.text.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  userText: {
    color: colors.text.inverse,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
  typingText: {
    color: colors.text.muted,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  chip: {
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPressed: {
    backgroundColor: colors.bg.surfaceMuted,
  },
  chipText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text.primary,
  },
  inputWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.surface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.surfaceMuted,
    fontSize: fontSizes.sm,
    color: colors.text.primary,
    fontWeight: '600',
  },
  sendButton: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.blue,
    ...shadows.soft,
  },
  sendButtonPressed: {
    opacity: 0.9,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  footerText: {
    marginTop: 8,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text.muted,
  },
});
