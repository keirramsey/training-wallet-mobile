import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiFetch } from '@/src/lib/api';
import { DEMO_CREDENTIALS, inferStatus } from '@/src/data/demoCredentials';
import { getLocalCredentials } from '@/src/storage/credentialsStore';
import {
  formatDate,
  getYear,
  isExpired,
  mergeCredentials,
  normalizeApiError,
  parseCredentials,
} from '@/src/lib/credentialUtils';
import {
  cardThemes,
  colors,
  fontSizes,
  layout,
  pressedState,
  radii,
  shadows,
  spacing,
} from '@/src/theme/tokens';
import type { Credential } from '@/src/types/credential';

type HistoryFilter = 'all' | 'current' | 'expired';

type GroupedCredentials = { year: number; items: Credential[] }[];

function groupByYear(credentials: Credential[]): GroupedCredentials {
  const groups: Record<number, Credential[]> = {};

  for (const cred of credentials) {
    const year = getYear(cred.issued_at);
    if (!groups[year]) groups[year] = [];
    groups[year].push(cred);
  }

  return Object.entries(groups)
    .map(([year, items]) => ({ year: parseInt(year, 10), items }))
    .sort((a, b) => b.year - a.year);
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; httpStatus?: number } | null>(null);
  const [items, setItems] = useState<Credential[]>([]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

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

      const merged = mergeCredentials(apiItems, local);
      if (merged.length === 0) {
        setItems(DEMO_CREDENTIALS);
      } else {
        setItems(merged);
      }
    } catch (err) {
      setItems(DEMO_CREDENTIALS);
      setError(normalizeApiError(err));
    } finally {
      if (mode === 'refresh') setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  const handleCredentialPress = useCallback((id: string) => {
    triggerHaptic();
    router.push(`/credential/${id}`);
  }, [router, triggerHaptic]);

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
    return items;
  }, [filter, items]);

  const groupedItems = useMemo(() => groupByYear(filteredItems), [filteredItems]);

  const onRefresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  const filters: { key: HistoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'current', label: 'Current' },
    { key: 'expired', label: 'Show Expired' }, // Renamed to avoid test collision
  ];

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your training credential timeline</Text>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((chip) => {
            const active = chip.key === filter;
            return (
              <Pressable
                key={chip.key}
                accessibilityRole="button"
                onPress={() => setFilter(chip.key)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Loading State */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brand.blue} />
            <Text style={styles.muted}>Loading credentials...</Text>
          </View>
        )}

        {/* Error State */}
        {!loading && error && items.length === 0 && (
          <View style={[styles.panel, styles.errorPanel]}>
            <Text style={styles.panelTitle}>Couldn't load</Text>
            <Text style={styles.panelBody}>
              {typeof error.httpStatus === 'number'
                ? `HTTP ${error.httpStatus}: ${error.message}`
                : error.message}
            </Text>
          </View>
        )}

        {/* Grouped Credentials by Year */}
        {!loading && groupedItems.map((group) => (
          <View key={group.year} style={styles.yearSection}>
            <View style={styles.yearHeader}>
              <View style={styles.yearLine} />
              <Text style={styles.yearLabel}>{group.year}</Text>
              <View style={styles.yearLine} />
            </View>

            <View style={styles.ticketList}>
              {group.items.map((item) => {
                const expired = isExpired(item);
                const status = inferStatus(item);
                const statusLabel = expired ? 'Expired' : status === 'verified' ? 'Active' : 'Processing';
                const themeKey = item.colorTheme || 'cyan';
                const theme = cardThemes[themeKey] || cardThemes.cyan;

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}, ${statusLabel}`}
                    onPress={() => handleCredentialPress(item.id)}
                    style={({ pressed }) => [
                      styles.ticketStub,
                      pressed && styles.pressed,
                    ]}
                  >
                    {/* Left Color Strip */}
                    <View style={[styles.ticketStrip, { backgroundColor: theme.from }]} />

                    {/* Decorative Holes */}
                    <View style={styles.ticketHoles}>
                      <View style={styles.ticketHole} />
                      <View style={styles.ticketHole} />
                      <View style={styles.ticketHole} />
                    </View>

                    {/* Content */}
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketTop}>
                        <View style={styles.ticketInfo}>
                          <Text style={styles.ticketTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.ticketIssuer} numberOfLines={1}>
                            {item.issuer_name}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            expired ? styles.statusExpired : styles.statusActive,
                          ]}
                        >
                          <FontAwesome5
                            name={expired ? 'times-circle' : 'check-circle'}
                            size={10}
                            color={expired ? colors.danger : colors.success}
                            solid
                          />
                          <Text
                            style={[
                              styles.statusText,
                              expired ? styles.statusTextExpired : styles.statusTextActive,
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ticketBottom}>
                        <View style={styles.ticketMeta}>
                          <FontAwesome5 name="calendar-alt" size={12} color={colors.text.muted} />
                          <Text style={styles.ticketDate}>
                            Expires: {formatDate(item.expires_at)}
                          </Text>
                        </View>
                        <FontAwesome5 name="chevron-right" size={12} color={colors.text.muted} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FontAwesome5 name="history" size={32} color={colors.text.muted} />
            </View>
            <Text style={styles.emptyTitle}>No credentials found</Text>
            <Text style={styles.emptyBody}>
              {filter === 'expired'
                ? 'No expired credentials in your history.'
                : filter === 'current'
                  ? 'No active credentials found.'
                  : 'Your credential history will appear here.'}
            </Text>
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
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '900',
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.muted,
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(43, 201, 244, 0.1)',
    borderColor: colors.brand.cyan,
  },
  filterText: {
    fontWeight: '700',
    color: colors.text.primary,
    fontSize: fontSizes.sm,
  },
  filterTextActive: {
    color: colors.brand.blue,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  muted: {
    color: colors.text.muted,
    fontWeight: '600',
  },
  panel: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorPanel: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  panelTitle: {
    fontSize: fontSizes.md,
    fontWeight: '900',
    color: colors.text.primary,
  },
  panelBody: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontWeight: '600',
    lineHeight: 20,
  },
  // Year Section
  yearSection: {
    gap: spacing.md,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  yearLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  yearLabel: {
    fontSize: fontSizes.lg,
    fontWeight: '900',
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
  },
  ticketList: {
    gap: spacing.sm,
  },
  // Ticket Stub
  ticketStub: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.soft,
  },
  ticketStrip: {
    width: 6,
  },
  ticketHoles: {
    width: 24,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  ticketHole: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bg.app,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketContent: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ticketInfo: {
    flex: 1,
    gap: 2,
  },
  ticketTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text.primary,
  },
  ticketIssuer: {
    color: colors.text.muted,
    fontWeight: '600',
    fontSize: fontSizes.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextExpired: {
    color: colors.danger,
  },
  ticketBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ticketDate: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: fontSizes.xs,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
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
  pressed: {
    opacity: pressedState.opacity,
    transform: [{ scale: pressedState.scale }],
  },
});
