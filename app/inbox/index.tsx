import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadows, spacing } from '@/src/theme/tokens';

type MessageType = 'alert' | 'training' | 'verification' | 'info';
type Message = {
  id: string;
  sender: string;
  senderAvatar?: string;
  title: string;
  preview: string;
  timestamp: string;
  type: MessageType;
  unread: boolean;
  hasLeftBorder?: boolean;
};

const DEMO_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    sender: 'System Alert',
    title: 'Urgent: Certification Expiring',
    preview: 'Your First Aid Certification is expiring in 30 days. Renew now to...',
    timestamp: '10:30 AM',
    type: 'alert',
    unread: true,
    hasLeftBorder: true,
  },
  {
    id: 'msg_2',
    sender: 'Safety Corp',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq6718gYVoM4MjOXnz7plMen0MlHeqG5asRP6pOTJ6FsYyEkHLHVxZRxnMU8VhSoDnY-q8BBEFSf-Sx5FSUvvsbTLBaQityZ5DafDmg5OjyJYGPjM1rFwOn_T7_sJs6tTlnQvBjWWjiAsawBQz9QVInnGsX57TcJELbMs12egP9sJ2AG1K3EsWVQZCMFBFvDMy1d4QzqEe23huKslEEgJZh38uSTzj4sZmJgwswlsR6VnHSnyKJOqKmVOUMlvqkveqKmv_E1E7LTc',
    title: 'New training module available',
    preview: 'We have assigned "Advanced Fire Safety Procedures" to your profile....',
    timestamp: 'Yesterday',
    type: 'training',
    unread: true,
  },
  {
    id: 'msg_3',
    sender: 'Verification Update',
    title: '',
    preview: 'Credential #40291 has been successfully verified. You can no...',
    timestamp: 'Mon',
    type: 'verification',
    unread: false,
  },
  {
    id: 'msg_4',
    sender: 'Training Wallet Team',
    title: 'Welcome to your new wallet',
    preview: 'Thank you for downloading Training Wallet. Tap here to start...',
    timestamp: 'Oct 12',
    type: 'info',
    unread: false,
  },
];

const getIconForType = (type: MessageType) => {
  switch (type) {
    case 'alert':
      return { name: 'bell', bgColor: '#FEE2E2', iconColor: '#DC2626' };
    case 'training':
      return { name: 'user-graduate', bgColor: '#DBEAFE', iconColor: '#2563EB' };
    case 'verification':
      return { name: 'check-circle', bgColor: '#D1FAE5', iconColor: '#059669' };
    case 'info':
      return { name: 'envelope', bgColor: '#E0E7FF', iconColor: '#4F46E5' };
    default:
      return { name: 'envelope', bgColor: '#E0E7FF', iconColor: '#4F46E5' };
  }
};

type FilterTab = 'all' | 'unread' | 'archived';

export default function InboxListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const unreadCount = useMemo(
    () => DEMO_MESSAGES.filter((m) => m.unread).length,
    []
  );

  const filteredMessages = useMemo(() => {
    if (activeTab === 'unread') return DEMO_MESSAGES.filter((m) => m.unread);
    if (activeTab === 'archived') return [];
    return DEMO_MESSAGES;
  }, [activeTab]);

  const onMarkAllRead = useCallback(() => {
    Alert.alert('Marked as Read', 'All messages have been marked as read.');
    // In production, this would update message state via API
  }, []);

  const onOpenMessage = useCallback(
    (id: string) => {
      router.push(`/inbox/${id}`);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Pressable onPress={onMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          <Pressable
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
            onPress={() => setActiveTab('unread')}
          >
            <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'archived' && styles.tabActive]}
            onPress={() => setActiveTab('archived')}
          >
            <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive]}>
              Archived
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Messages List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="inbox" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>No messages</Text>
          </View>
        ) : (
          filteredMessages.map((message) => {
            const icon = getIconForType(message.type);
            return (
              <Pressable
                key={message.id}
                style={({ pressed }) => [
                  styles.messageCard,
                  message.hasLeftBorder && styles.messageCardHighlight,
                  pressed && styles.messageCardPressed,
                ]}
                onPress={() => onOpenMessage(message.id)}
              >
                <View style={styles.messageRow}>
                  {/* Avatar/Icon */}
                  {message.senderAvatar ? (
                    <Image
                      source={{ uri: message.senderAvatar }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.iconWrap, { backgroundColor: icon.bgColor }]}>
                      <FontAwesome5 name={icon.name} size={18} color={icon.iconColor} />
                    </View>
                  )}

                  {/* Content */}
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.senderName}>{message.sender}</Text>
                      <Text
                        style={[
                          styles.timestamp,
                          message.unread && styles.timestampUnread,
                        ]}
                      >
                        {message.timestamp}
                      </Text>
                    </View>
                    {message.title ? (
                      <Text
                        style={[
                          styles.messageTitle,
                          message.unread && styles.messageTitleUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {message.title}
                      </Text>
                    ) : null}
                    <Text style={styles.messagePreview} numberOfLines={2}>
                      {message.preview}
                    </Text>
                  </View>

                  {/* Unread dot or chevron */}
                  {message.unread ? (
                    <View style={styles.unreadDot} />
                  ) : (
                    <FontAwesome5 name="chevron-right" size={14} color={colors.border} />
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.auth,
  },
  header: {
    backgroundColor: colors.bg.auth,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  tabsContainer: {
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.inverse,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 100,
  },
  messageCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.soft,
  },
  messageCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  messageCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.surfaceMuted,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
    gap: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.muted,
  },
  timestampUnread: {
    color: colors.primary,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  messageTitleUnread: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  messagePreview: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.muted,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.muted,
  },
});
