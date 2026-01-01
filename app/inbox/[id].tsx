import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
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

import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';

type MessageInThread = {
  id: string;
  sender: 'them' | 'me';
  senderName?: string;
  text: string;
  timestamp: string;
};

type Conversation = {
  id: string;
  subject: string;
  participant: string;
  participantAvatar?: string;
  participantVerified?: boolean;
  messages: MessageInThread[];
  canReply: boolean;
};

const DEMO_CONVERSATIONS: Record<string, Conversation> = {
  msg_1: {
    id: 'msg_1',
    subject: 'Urgent: Your White Card is expiring soon',
    participant: 'Construction Skills Queensland',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgOh6Nj_0GMq_GllUl4649L1ZENgIC9BmfNmgIOwBfeCw1x9nrtVEJAvVQuaKkEotuIbsMPJS2XuB_SQrXZFltFFA7ST5QRHxwHo85epaolLXRP_N684bhjpRdgerQsNcBzud9A1AuhHzPzrNMuqMzNeTk-Wl-r6ivoC0YLFvHx3Wn0UkuVU19IqYmnLni97svuyegcKFFrs_Fgne72yO36bHSWXkE6Nc-OoTe-9BKA33bM_LvVWmyW2ng0uJlE9HkfpucynNOs4U',
    participantVerified: true,
    canReply: true,
    messages: [
      {
        id: 'm1',
        sender: 'them',
        senderName: 'CSQ Support',
        text: 'Hi Alex, just a reminder that your General Construction Induction Card (White Card) is set to expire in 30 days.',
        timestamp: 'Oct 24, 10:30 AM',
      },
      {
        id: 'm2',
        sender: 'them',
        senderName: 'CSQ Support',
        text: 'Please review the renewal requirements to ensure you remain compliant with current site safety regulations.',
        timestamp: 'Oct 24, 10:31 AM',
      },
      {
        id: 'm3',
        sender: 'me',
        text: 'Thanks for the reminder. How do I renew my White Card?',
        timestamp: 'Oct 24, 2:15 PM',
      },
      {
        id: 'm4',
        sender: 'them',
        senderName: 'CSQ Support',
        text: 'You can renew through our online portal or by completing a refresher course with an approved RTO. Would you like me to send you a list of approved providers in your area?',
        timestamp: 'Oct 24, 3:45 PM',
      },
    ],
  },
  msg_2: {
    id: 'msg_2',
    subject: 'New training module available',
    participant: 'Safety Corp',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq6718gYVoM4MjOXnz7plMen0MlHeqG5asRP6pOTJ6FsYyEkHLHVxZRxnMU8VhSoDnY-q8BBEFSf-Sx5FSUvvsbTLBaQityZ5DafDmg5OjyJYGPjM1rFwOn_T7_sJs6tTlnQvBjWWjiAsawBQz9QVInnGsX57TcJELbMs12egP9sJ2AG1K3EsWVQZCMFBFvDMy1d4QzqEe23huKslEEgJZh38uSTzj4sZmJgwswlsR6VnHSnyKJOqKmVOUMlvqkveqKmv_E1E7LTc',
    canReply: true,
    messages: [
      {
        id: 'm1',
        sender: 'them',
        senderName: 'Safety Corp Training',
        text: 'Hello! We have assigned "Advanced Fire Safety Procedures" to your profile.',
        timestamp: 'Yesterday, 2:15 PM',
      },
      {
        id: 'm2',
        sender: 'them',
        senderName: 'Safety Corp Training',
        text: 'Please complete this training module by Friday. You can access it through the Search Training platform.',
        timestamp: 'Yesterday, 2:16 PM',
      },
    ],
  },
  msg_3: {
    id: 'msg_3',
    subject: 'Verification Update',
    participant: 'Training Wallet',
    canReply: false,
    messages: [
      {
        id: 'm1',
        sender: 'them',
        senderName: 'System',
        text: 'Good news! Credential #40291 has been successfully verified.',
        timestamp: 'Monday, 9:00 AM',
      },
      {
        id: 'm2',
        sender: 'them',
        senderName: 'System',
        text: 'You can now use this credential for site access requests. The verification was completed by the issuing RTO.',
        timestamp: 'Monday, 9:00 AM',
      },
    ],
  },
  msg_4: {
    id: 'msg_4',
    subject: 'Welcome to your new wallet',
    participant: 'Training Wallet Team',
    canReply: true,
    messages: [
      {
        id: 'm1',
        sender: 'them',
        senderName: 'Training Wallet',
        text: 'Welcome to Training Wallet! Thank you for downloading the app.',
        timestamp: 'Oct 12, 11:00 AM',
      },
      {
        id: 'm2',
        sender: 'them',
        senderName: 'Training Wallet',
        text: 'With Training Wallet, you can securely store, verify, and share your training credentials with employers and RTOs.',
        timestamp: 'Oct 12, 11:00 AM',
      },
      {
        id: 'm3',
        sender: 'them',
        senderName: 'Training Wallet',
        text: 'Need help getting started? Just reply to this message and our support team will assist you.',
        timestamp: 'Oct 12, 11:01 AM',
      },
    ],
  },
};

export default function InboxDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id) ?? '',
    [params.id]
  );

  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState<MessageInThread[]>([]);
  const [initialized, setInitialized] = useState(false);

  const conversation = DEMO_CONVERSATIONS[id] ?? {
    id,
    subject: 'Message',
    participant: 'Training Wallet',
    canReply: false,
    messages: [
      {
        id: 'placeholder',
        sender: 'them' as const,
        senderName: 'System',
        text: 'This conversation is still syncing from Search Training. Check back soon.',
        timestamp: 'Just now',
      },
    ],
  };

  // Initialize messages from conversation
  if (!initialized) {
    setMessages(conversation.messages);
    setInitialized(true);
  }

  const goBack = useCallback(() => router.back(), [router]);

  const onDelete = useCallback(() => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }, [router]);

  const onSendReply = useCallback(() => {
    if (!replyText.trim()) return;

    const newMessage: MessageInThread = {
      id: `m_${Date.now()}`,
      sender: 'me',
      text: replyText.trim(),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMessage]);
    setReplyText('');

    // Scroll to bottom after sending
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [replyText]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={16} color={colors.primary} />
          <Text style={styles.backText}>Inbox</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation.participant}
          </Text>
          {conversation.participantVerified && (
            <FontAwesome5 name="check-circle" size={12} color={colors.primary} solid />
          )}
        </View>
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <FontAwesome5 name="trash-alt" size={18} color={colors.text.muted} />
        </Pressable>
      </View>

      {/* Subject Banner */}
      <View style={styles.subjectBanner}>
        <Text style={styles.subjectText} numberOfLines={1}>
          {conversation.subject}
        </Text>
      </View>

      {/* Messages Thread */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: conversation.canReply ? 100 : 40 }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg, index) => {
          const isMe = msg.sender === 'me';
          const showAvatar = !isMe && (index === 0 || messages[index - 1]?.sender === 'me');

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowThem,
              ]}
            >
              {!isMe && (
                <View style={styles.avatarSlot}>
                  {showAvatar ? (
                    conversation.participantAvatar ? (
                      <Image
                        source={{ uri: conversation.participantAvatar }}
                        style={styles.messageAvatar}
                      />
                    ) : (
                      <View style={styles.messageAvatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {conversation.participant.charAt(0)}
                        </Text>
                      </View>
                    )
                  ) : null}
                </View>
              )}
              <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                {!isMe && msg.senderName && showAvatar && (
                  <Text style={styles.senderName}>{msg.senderName}</Text>
                )}
                <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                  {msg.text}
                </Text>
                <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Reply Input */}
      {conversation.canReply && (
        <View style={[styles.replyContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.replyInputRow}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.text.muted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={1000}
            />
            <Pressable
              onPress={onSendReply}
              disabled={!replyText.trim()}
              style={({ pressed }) => [
                styles.sendButton,
                !replyText.trim() && styles.sendButtonDisabled,
                pressed && replyText.trim() && styles.sendButtonPressed,
              ]}
            >
              <FontAwesome5
                name="paper-plane"
                size={18}
                color={replyText.trim() ? colors.text.inverse : colors.text.muted}
                solid
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* No Reply Notice */}
      {!conversation.canReply && (
        <View style={[styles.noReplyBanner, { paddingBottom: insets.bottom + spacing.md }]}>
          <FontAwesome5 name="info-circle" size={14} color={colors.text.muted} />
          <Text style={styles.noReplyText}>This is an automated message and cannot be replied to.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectBanner: {
    backgroundColor: colors.bg.surfaceMuted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subjectText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowThem: {
    justifyContent: 'flex-start',
  },
  avatarSlot: {
    width: 32,
    height: 32,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.surfaceMuted,
  },
  messageAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.muted,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.bg.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.blue,
    marginBottom: 4,
  },
  messageText: {
    fontSize: fontSizes.md,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: 22,
  },
  messageTextMe: {
    color: colors.text.inverse,
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.muted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  replyContainer: {
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.sm,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  replyInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.bg.app,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  sendButtonDisabled: {
    backgroundColor: colors.bg.surfaceMuted,
  },
  sendButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  noReplyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noReplyText: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: colors.text.muted,
  },
});
