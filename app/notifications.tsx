import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { accessibility, colors, fontSizes, layout, pressedState, radii, shadows, spacing } from '@/src/theme/tokens';

type Notification = {
  id: string;
  type: 'expiring' | 'expired' | 'new' | 'message' | 'update';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
};

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'expiring',
    title: 'Credential Expiring Soon',
    body: 'Your First Aid / CPR certification expires in 30 days. Consider renewing now.',
    timestamp: '2024-12-29T10:00:00Z',
    read: false,
    actionUrl: '/credential/demo_2',
  },
  {
    id: 'n2',
    type: 'new',
    title: 'New Credential Added',
    body: 'Your Working at Heights certification has been verified and added to your wallet.',
    timestamp: '2024-12-28T14:30:00Z',
    read: true,
    actionUrl: '/credential/demo_5',
  },
  {
    id: 'n3',
    type: 'message',
    title: 'Message from Search Training',
    body: 'Your upcoming Traffic Control refresher course is confirmed for January 15th.',
    timestamp: '2024-12-27T09:15:00Z',
    read: true,
    actionUrl: '/inbox/msg_2',
  },
  {
    id: 'n4',
    type: 'update',
    title: 'System Update',
    body: 'Training Wallet has been updated with new features. Check out the improved credential sharing!',
    timestamp: '2024-12-25T16:00:00Z',
    read: true,
    actionUrl: '/inbox/msg_4',
  },
];

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'expiring':
      return { name: 'clock', color: colors.warning };
    case 'expired':
      return { name: 'exclamation-circle', color: colors.danger };
    case 'new':
      return { name: 'check-circle', color: colors.success };
    case 'message':
      return { name: 'envelope', color: colors.brand.blue };
    case 'update':
      return { name: 'bell', color: colors.text.muted };
    default:
      return { name: 'bell', color: colors.text.muted };
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl as never);
    }
  }, [router, markAsRead]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.safe}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={accessibility.hitSlop}
        >
          <FontAwesome5 name="arrow-left" size={18} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Inbox</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FontAwesome5 name="inbox" size={32} color={colors.text.muted} />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyBody}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map(notification => {
              const icon = getNotificationIcon(notification.type);
              return (
                <Pressable
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  accessibilityRole="button"
                  accessibilityLabel={`${notification.title}. ${notification.body}`}
                  style={({ pressed }) => [
                    styles.notificationItem,
                    !notification.read && styles.notificationUnread,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                    <FontAwesome5 name={icon.name} size={16} color={icon.color} />
                  </View>
                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          !notification.read && styles.notificationTitleUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {notification.title}
                      </Text>
                      <Text style={styles.timestamp}>
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </View>
                    <Text style={styles.notificationBody} numberOfLines={2}>
                      {notification.body}
                    </Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: accessibility.touchTarget,
    height: accessibility.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    color: colors.text.primary,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bg.surface,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.soft,
  },
  notificationUnread: {
    backgroundColor: 'rgba(43, 201, 244, 0.03)',
    borderColor: 'rgba(43, 201, 244, 0.2)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  notificationTitle: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  notificationTitleUnread: {
    fontWeight: '800',
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.text.muted,
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.cyan,
    marginTop: 6,
  },
  pressed: {
    opacity: pressedState.opacity,
    transform: [{ scale: pressedState.scale }],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.text.primary,
  },
  emptyBody: {
    color: colors.text.muted,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 280,
  },
});
