import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';

type Message = {
  id: string;
  title: string;
  body: string;
  received_at: string;
  kind: 'expiry' | 'info' | 'success';
  unread: boolean;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

export default function InboxListScreen() {
  const router = useRouter();

  const messages = useMemo<Message[]>(
    () => [
      {
        id: 'msg_expiring_first_aid',
        title: 'First Aid expiring soon',
        body: 'Your HLTAID011 ticket expires in 30 days. Renew early to avoid gaps in coverage.',
        received_at: '2025-12-10T09:00:00.000Z',
        kind: 'expiry',
        unread: true,
      },
      {
        id: 'msg_wallet_tip',
        title: 'Tip: Share your credential',
        body: 'Use the Share tab to send a simple JSON summary to your employer or RTO.',
        received_at: '2025-12-05T12:30:00.000Z',
        kind: 'info',
        unread: false,
      },
      {
        id: 'msg_uploaded_draft',
        title: 'Upload saved to wallet',
        body: 'Your uploaded certificate is saved as a draft. Add details when you’re ready.',
        received_at: '2025-12-01T16:15:00.000Z',
        kind: 'success',
        unread: false,
      },
    ],
    []
  );

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Inbox</Text>
        <Text style={styles.heroSubtitle}>Messages, reminders, and updates.</Text>
      </LinearGradient>

      <View style={styles.panel}>
        {messages.map((msg) => {
          const tone = msg.kind === 'expiry' ? 'warn' : msg.kind === 'success' ? 'good' : 'info';
          return (
            <Pressable
              key={msg.id}
              accessibilityRole="button"
              onPress={() => router.push(`/inbox/${msg.id}`)}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
            >
              <View
                style={[
                  styles.iconPill,
                  tone === 'warn' ? styles.iconWarn : tone === 'good' ? styles.iconGood : styles.iconInfo,
                ]}
              >
                <FontAwesome
                  name={msg.kind === 'expiry' ? 'clock-o' : msg.kind === 'success' ? 'check' : 'info'}
                  size={16}
                  color="#0B1220"
                />
              </View>
              <View style={styles.rowText}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {msg.title}
                  </Text>
                  <Text style={styles.rowDate}>{formatDate(msg.received_at)}</Text>
                </View>
                <Text style={styles.rowBody} numberOfLines={2}>
                  {msg.body}
                </Text>
              </View>
              {msg.unread ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  panel: {
    borderRadius: 18,
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    backgroundColor: '#F3F4F6',
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconWarn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  iconGood: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  iconInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowTitle: {
    flex: 1,
    fontWeight: '900',
    color: '#0B1220',
  },
  rowDate: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 12,
  },
  rowBody: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#0E89BA',
  },
});

