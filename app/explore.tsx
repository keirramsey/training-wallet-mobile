import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { apiFetch } from '@/src/lib/api';
import type { Credential } from '@/src/types/credential';

type FilterChip = { key: string; label: string };

const COMMON_CATEGORIES: FilterChip[] = [
  { key: 'First Aid', label: 'First Aid' },
  { key: 'Construction', label: 'Construction' },
  { key: 'Safety', label: 'Safety' },
  { key: 'Chainsaw', label: 'Chainsaw' },
  { key: 'Forklift', label: 'Forklift' },
];

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
  if (!payload || typeof payload !== 'object') return [];
  const anyPayload = payload as { ok?: unknown; items?: unknown };
  if (anyPayload.ok !== true) return [];
  if (!Array.isArray(anyPayload.items)) return [];
  return anyPayload.items as Credential[];
}

function titleToCategories(title: string): string[] {
  const normalized = title.toLowerCase();
  const categories: string[] = [];

  if (normalized.includes('first aid') || normalized.includes('hltaid')) categories.push('First Aid');
  if (normalized.includes('white card') || normalized.includes('construction')) categories.push('Construction');
  if (normalized.includes('safety')) categories.push('Safety');
  if (normalized.includes('chainsaw') || normalized.includes('arbor')) categories.push('Chainsaw');
  if (normalized.includes('forklift')) categories.push('Forklift');

  return categories;
}

export default function ExploreScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; httpStatus?: number } | null>(null);
  const [items, setItems] = useState<Credential[]>([]);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const payload = (await apiFetch('/api/credentials')) as unknown;
      setItems(parseCredentials(payload));
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

  const derivedCategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (!item.title) continue;
      for (const category of titleToCategories(item.title)) set.add(category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const onOpenSearchTraining = useCallback(async () => {
    await Linking.openURL('https://searchtraining.com.au');
  }, []);

  const onBrowsePopular = useCallback(async () => {
    await Linking.openURL('https://searchtraining.com.au/courses');
  }, []);

  const onRefresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  return (
    <ScreenContainer refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Explore</Text>
        <Text style={styles.heroSubtitle}>
          Find the right course on Search Training and keep your tickets in one place.
        </Text>
      </LinearGradient>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenSearchTraining}
          style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
        >
          <View style={styles.buttonRow}>
            <FontAwesome name="external-link" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Open SearchTraining.com.au</Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onBrowsePopular}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <View style={styles.buttonRow}>
            <FontAwesome name="star" size={18} color="#0B1220" />
            <Text style={styles.secondaryButtonText}>Browse popular tickets</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Categories</Text>
        <Text style={styles.panelBody}>Suggested categories and a few derived from your wallet.</Text>

        {loading && (
          <View style={styles.inline}>
            <ActivityIndicator />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        )}

        {!loading && error && (
          <Text style={styles.errorText}>
            {typeof error.httpStatus === 'number'
              ? `HTTP ${error.httpStatus}: ${error.message}`
              : error.message}
          </Text>
        )}

        {!loading && !error && (
          <View style={styles.chips}>
            {COMMON_CATEGORIES.map((chip) => (
              <View key={chip.key} style={styles.chip}>
                <Text style={styles.chipText}>{chip.label}</Text>
              </View>
            ))}
            {derivedCategories
              .filter((c) => !COMMON_CATEGORIES.some((x) => x.key === c))
              .map((category) => (
                <View key={category} style={styles.chip}>
                  <Text style={styles.chipText}>{category}</Text>
                </View>
              ))}
          </View>
        )}
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
  actions: {
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#0E89BA',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0B1220',
    fontWeight: '900',
  },
  panel: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1220',
  },
  panelBody: {
    marginTop: -6,
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 18,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  chipText: {
    fontWeight: '900',
    color: '#0B1220',
  },
  muted: {
    color: '#6B7280',
    fontWeight: '600',
  },
  errorText: {
    color: '#991B1B',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
});

