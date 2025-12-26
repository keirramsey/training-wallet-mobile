import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';

type Message = {
  id: string;
  title: string;
  body: string;
  received_at: string;
  kind: 'expiry' | 'info' | 'success';
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const DEMO_MESSAGES: Message[] = [
  {
    id: 'msg_expiring_first_aid',
    title: 'First Aid expiring soon',
    body: 'Your HLTAID011 ticket expires in 30 days. Renew early to avoid gaps in coverage.\n\nTip: Search Training can help you find a nearby refresher course.',
    received_at: '2025-12-10T09:00:00.000Z',
    kind: 'expiry',
  },
  {
    id: 'msg_wallet_tip',
    title: 'Tip: Share your credential',
    body: 'Use the Share tab to send a simple JSON summary to your employer or RTO.\n\nYou can also open a credential and tap “Share credential” to preselect it.',
    received_at: '2025-12-05T12:30:00.000Z',
    kind: 'info',
  },
  {
    id: 'msg_uploaded_draft',
    title: 'Upload saved to wallet',
    body: 'Your uploaded certificate is saved as a draft. Add details when you’re ready.\n\nYou can edit the draft later from your wallet.',
    received_at: '2025-12-01T16:15:00.000Z',
    kind: 'success',
  },
];

export default function InboxDetailScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id) ?? '', [params.id]);

  const message = useMemo(() => DEMO_MESSAGES.find((m) => m.id === id) ?? null, [id]);

  useEffect(() => {
    navigation.setOptions({ title: 'Message' });
  }, [navigation]);

  if (!message) {
    return (
      <ScreenContainer>
        <View style={[styles.panel, styles.errorPanel]}>
          <Text style={styles.panelTitle}>Not found</Text>
          <Text style={styles.panelBody}>This message doesn’t exist.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const tone = message.kind === 'expiry' ? 'warn' : message.kind === 'success' ? 'good' : 'info';

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Message</Text>
        <Text style={styles.heroSubtitle}>{formatDateTime(message.received_at)}</Text>
      </LinearGradient>

      <View style={styles.panel}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconPill,
              tone === 'warn' ? styles.iconWarn : tone === 'good' ? styles.iconGood : styles.iconInfo,
            ]}
          >
            <FontAwesome
              name={message.kind === 'expiry' ? 'clock-o' : message.kind === 'success' ? 'check' : 'info'}
              size={16}
              color="#0B1220"
            />
          </View>
          <Text style={styles.title}>{message.title}</Text>
        </View>

        <Text style={styles.body}>{message.body}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.secondaryButtonText}>Back to Inbox</Text>
        </Pressable>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  errorPanel: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1220',
  },
  panelBody: {
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#0B1220',
  },
  body: {
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0B1220',
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.92,
  },
});

