import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { apiFetch } from '@/src/lib/api';
import { getLocalCredentials } from '@/src/storage/credentialsStore';
import type { Credential } from '@/src/types/credential';

type HistoryFilter = 'all' | 'current' | 'expired' | 'unverified';

function normalizeApiError(err: unknown): { message: string; httpStatus?: number } {
  const anyErr = err as { message?: unknown; status?: unknown };
  const rawMessage = typeof anyErr?.message === 'string' ? anyErr.message.trim() : '';
  const httpStatus = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  if (!rawMessage) return { message: 'Request failed', httpStatus };
  if (/\b\d{3}\b/.test(rawMessage) || /^request failed\b/i.test(rawMessage)) {
    return { message: rawMessage, httpStatus };
  }
  return { message: `Request failed: ${rawMessage}`, httpStatus };
}

function parseCredentials(payload: unknown): Credential[] {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Unexpected /api/credentials response');
  }
  const anyPayload = payload as { ok?: unknown; items?: unknown };
  if (anyPayload.ok !== true) throw new Error('Unexpected /api/credentials response');
  if (!Array.isArray(anyPayload.items)) throw new Error('Unexpected /api/credentials response');
  return anyPayload.items as Credential[];
}

function mergeCredentials(apiItems: Credential[], localItems: Credential[]): Credential[] {
  const seen = new Set<string>();
  const merged: Credential[] = [];

  for (const item of [...apiItems, ...localItems]) {
    if (!item?.id) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged.sort((a, b) => {
    const aTime = new Date(a.issued_at).getTime();
    const bTime = new Date(b.issued_at).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function isExpired(credential: Credential): boolean {
  if (!credential.expires_at) return false;
  const expiresAt = new Date(credential.expires_at).getTime();
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt < Date.now();
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'No expiry';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'No expiry';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function HistoryScreen() {
  const router = useRouter();

  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; httpStatus?: number } | null>(null);
  const [items, setItems] = useState<Credential[]>([]);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const local = await getLocalCredentials();
      let apiItems: Credential[] = [];

      try {
        const payload = (await apiFetch('/api/credentials')) as unknown;
        apiItems = parseCredentials(payload);
      } catch (apiErr) {
        setError(normalizeApiError(apiErr));
      }

      setItems(mergeCredentials(apiItems, local));
    } catch (err) {
      setItems([]);
      setError(normalizeApiError(err));
    } finally {
      if (mode === 'refresh') setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('initial');
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load('refresh');
    }, [load])
  );

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'expired') return items.filter(isExpired);
    if (filter === 'current') return items.filter((c) => !isExpired(c));
    if (filter === 'unverified') return items.filter((c) => c.status !== 'verified');
    return items;
  }, [filter, items]);

  const onRefresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  const filters: { key: HistoryFilter; label: string }[] = useMemo(
    () => [
      { key: 'all', label: 'All' },
      { key: 'current', label: 'Current' },
      { key: 'expired', label: 'Expired' },
      { key: 'unverified', label: 'Unverified' },
    ],
    []
  );

  return (
    <ScreenContainer scroll={false} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>A compact list of your training credentials.</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((chip) => {
          const active = chip.key === filter;
          return (
            <Pressable
              key={chip.key}
              accessibilityRole="button"
              onPress={() => setFilter(chip.key)}
              style={({ pressed }) => [
                styles.filterChip,
                active ? styles.filterChipActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      )}

      {!loading && error && items.length === 0 && (
        <View style={[styles.panel, styles.errorPanel]}>
          <Text style={styles.panelTitle}>Couldn’t load</Text>
          <Text style={styles.panelBody}>
            {typeof error.httpStatus === 'number'
              ? `HTTP ${error.httpStatus}: ${error.message}`
              : error.message}
          </Text>
        </View>
      )}

      {!loading && error && items.length > 0 && (
        <View style={[styles.panel, styles.warnPanel]}>
          <Text style={styles.panelBody}>
            {typeof error.httpStatus === 'number'
              ? `Sync issue (HTTP ${error.httpStatus}) — showing local credentials`
              : 'Sync issue — showing local credentials'}
          </Text>
        </View>
      )}

      {!loading && (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const expired = isExpired(item);
            const unverified = item.status !== 'verified';
            const statusLabel = expired ? 'Expired' : unverified ? 'Unverified' : 'Current';
            const statusTone = expired ? 'bad' : unverified ? 'warn' : 'good';

            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/credential/${item.id}`)}
                style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowIssuer} numberOfLines={1}>
                    {item.issuer_name}
                  </Text>
                  <Text style={styles.rowMeta}>Expiry: {formatDate(item.expires_at)}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    statusTone === 'good'
                      ? styles.statusGood
                      : statusTone === 'warn'
                        ? styles.statusWarn
                        : styles.statusBad,
                  ]}
                >
                  <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.panel}>
              <Text style={styles.panelBody}>No credentials match this filter.</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0B1220',
  },
  subtitle: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#ECFEFF',
    borderColor: '#A5F3FC',
  },
  filterText: {
    fontWeight: '900',
    color: '#0B1220',
  },
  filterTextActive: {
    color: '#0E89BA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  muted: {
    color: '#6B7280',
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 20,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowLeft: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  rowIssuer: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 12,
  },
  rowMeta: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 12,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusGood: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  statusWarn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  statusBad: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusText: {
    fontWeight: '900',
    color: '#0B1220',
    fontSize: 12,
  },
  panel: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorPanel: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  warnPanel: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0B1220',
  },
  panelBody: {
    marginTop: 6,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.92,
  },
});
