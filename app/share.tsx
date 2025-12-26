import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';
import { apiFetch } from '@/src/lib/api';
import { getLocalCredentials } from '@/src/storage/credentialsStore';
import type { Credential } from '@/src/types/credential';

type SelectedMap = Record<string, true>;

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
  if (!payload || typeof payload !== 'object') throw new Error('Unexpected /api/credentials response');
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

function toPreselectList(value: string | string[] | undefined): string[] {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) return [];
  return first
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ShareScreen() {
  const params = useLocalSearchParams<{ preselect?: string | string[] }>();
  const preselect = useMemo(() => toPreselectList(params.preselect), [params.preselect]);
  const appliedPreselectKey = useRef<string>('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; httpStatus?: number } | null>(null);
  const [items, setItems] = useState<Credential[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

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

  useEffect(() => {
    if (items.length === 0 || preselect.length === 0) return;
    const key = preselect.join(',');
    if (appliedPreselectKey.current === key) return;

    const ids = new Set(items.map((i) => i.id));
    const next: SelectedMap = {};
    for (const id of preselect) {
      if (ids.has(id)) next[id] = true;
    }
    if (Object.keys(next).length > 0) setSelected(next);
    appliedPreselectKey.current = key;
  }, [items, preselect]);

  const selectedIds = useMemo(() => Object.keys(selected), [selected]);
  const selectedItems = useMemo(() => {
    const map = new Map(items.map((i) => [i.id, i]));
    return selectedIds.map((id) => map.get(id)).filter((x): x is Credential => Boolean(x));
  }, [items, selectedIds]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev[id]) {
        const { [id]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: true };
    });
  }, []);

  const selectAll = useCallback(() => {
    const next: SelectedMap = {};
    for (const item of items) next[item.id] = true;
    setSelected(next);
  }, [items]);

  const clearAll = useCallback(() => setSelected({}), []);

  const onShare = useCallback(async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Select credentials', 'Choose one or more credentials to share.');
      return;
    }

    const payload = {
      shared_at: new Date().toISOString(),
      items: selectedItems.map((c) => ({
        id: c.id,
        title: c.title,
        issuer_name: c.issuer_name,
        issued_at: c.issued_at,
        expires_at: c.expires_at ?? null,
        status: c.status ?? 'unverified',
      })),
    };

    const message = JSON.stringify(payload, null, 2);
    try {
      await Share.share({ message });
    } catch (err) {
      Alert.alert('Share failed', err instanceof Error ? err.message : String(err));
    }
  }, [selectedItems]);

  const previewText = useMemo(() => {
    if (selectedItems.length === 0) return 'No credentials selected.';
    const titles = selectedItems.map((c) => c.title).slice(0, 5);
    const more = selectedItems.length > titles.length ? ` (+${selectedItems.length - titles.length} more)` : '';
    return `${selectedItems.length} selected: ${titles.join(', ')}${more}`;
  }, [selectedItems]);

  const onRefresh = useCallback(() => void load('refresh'), [load]);

  return (
    <ScreenContainer refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Share</Text>
        <Text style={styles.heroSubtitle}>Select credentials to share as a simple JSON payload.</Text>
      </LinearGradient>

      <View style={styles.panel}>
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            onPress={selectAll}
            disabled={items.length === 0}
            style={({ pressed }) => [
              styles.secondaryButton,
              items.length === 0 ? styles.disabled : null,
              pressed && items.length > 0 ? styles.pressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Select all</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={clearAll}
            disabled={selectedIds.length === 0}
            style={({ pressed }) => [
              styles.secondaryButton,
              selectedIds.length === 0 ? styles.disabled : null,
              pressed && selectedIds.length > 0 ? styles.pressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Clear</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={styles.inline}>
            <ActivityIndicator />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        )}

        {!loading && error && (
          <Text style={styles.warnText}>
            {typeof error.httpStatus === 'number'
              ? `Sync issue (HTTP ${error.httpStatus}) — showing local credentials`
              : 'Sync issue — showing local credentials'}
          </Text>
        )}

        {!loading && (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const checked = Boolean(selected[item.id]);
              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => toggle(item.id)}
                  style={({ pressed }) => [styles.row, pressed ? styles.pressedRow : null]}
                >
                  <FontAwesome
                    name={checked ? 'check-square-o' : 'square-o'}
                    size={20}
                    color={checked ? '#0E89BA' : '#9CA3AF'}
                  />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {item.issuer_name}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={styles.muted}>No credentials available.</Text>}
          />
        )}
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewTitle}>Preview</Text>
        <Text style={styles.previewBody}>{previewText}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onShare}
          disabled={selectedItems.length === 0}
          style={({ pressed }) => [
            styles.primaryButton,
            selectedItems.length === 0 ? styles.disabled : null,
            pressed && selectedItems.length > 0 ? styles.pressed : null,
          ]}
        >
          <Text style={styles.primaryButtonText}>Share</Text>
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
  toolbar: {
    flexDirection: 'row',
    gap: 10,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  muted: {
    color: '#6B7280',
    fontWeight: '600',
  },
  warnText: {
    color: '#92400E',
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pressedRow: {
    opacity: 0.92,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontWeight: '900',
    color: '#0B1220',
  },
  rowSubtitle: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0B1220',
    fontWeight: '900',
  },
  primaryButton: {
    backgroundColor: '#0E89BA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.92,
  },
  preview: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1220',
  },
  previewBody: {
    marginTop: 6,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
  },
});

