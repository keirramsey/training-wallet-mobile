import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CredentialCard, CARD_HEIGHT } from '@/components/CredentialCard';
import { apiFetch } from '@/src/lib/api';
import { buildNeedMoreTrainingUrl } from '@/services/searchTraining';
import { getLocalCredentials } from '@/src/storage/credentialsStore';
import { DEMO_CREDENTIALS } from '@/src/data/demoCredentials';
import type { Credential } from '@/src/types/credential';
import { colors, fontSizes, layout, radii, shadows, spacing } from '@/src/theme/tokens';

type CredentialsResponse = { ok: true; items: Credential[] };

type ActionType = 'student_info' | 'review_needed' | 'upcoming_course' | 'more';

type ActionItem = {
  type: ActionType;
  title: string;
  subtitle: string;
  cta: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
};

const CARD_SPACING = 16;
const ITEM_SIZE = CARD_HEIGHT + CARD_SPACING;
const MAX_CARD_WIDTH = layout.cardMaxWidth;
const EXPIRY_WINDOW_DAYS = 90;
const TAB_BAR_HEIGHT = 78;
const PILLS_HEIGHT = 56;
const ACTION_ROWS_MAX = 3;
const ACTION_CARD_RADIUS = 20;

function stringifyForError(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseCredentialsResponse(payload: unknown): Credential[] {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Unexpected /api/credentials response: expected an object');
  }

  const anyPayload = payload as { ok?: unknown; items?: unknown };
  if (anyPayload.ok !== true) {
    throw new Error(
      `Unexpected /api/credentials response: expected { ok: true, items: [] }, got ok=${stringifyForError(anyPayload.ok)}`
    );
  }

  if (!Array.isArray(anyPayload.items)) {
    throw new Error(
      `Unexpected /api/credentials response: expected items array, got ${stringifyForError(anyPayload.items)}`
    );
  }

  const items = anyPayload.items as unknown[];
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      throw new Error('Unexpected /api/credentials response: items must be objects');
    }
    const anyItem = item as { id?: unknown; title?: unknown; issuer_name?: unknown; issued_at?: unknown };
    if (typeof anyItem.id !== 'string') {
      throw new Error('Unexpected /api/credentials response: each item must have string id');
    }
    if (typeof anyItem.title !== 'string') {
      throw new Error(`Unexpected /api/credentials response: item ${anyItem.id} missing title`);
    }
    if (typeof anyItem.issuer_name !== 'string') {
      throw new Error(`Unexpected /api/credentials response: item ${anyItem.id} missing issuer_name`);
    }
    if (typeof anyItem.issued_at !== 'string') {
      throw new Error(`Unexpected /api/credentials response: item ${anyItem.id} missing issued_at`);
    }
  }

  return anyPayload.items as Credential[];
}

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

function daysUntil(iso: string): number | null {
  const date = new Date(iso);
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / (1000 * 60 * 60 * 24));
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

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ toast?: string; id?: string | string[] }>();
  const toastId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id) ?? '', [params.id]);
  const pillsBottom = insets.bottom + TAB_BAR_HEIGHT + 12;
  const contentBottomPadding = insets.bottom + TAB_BAR_HEIGHT + PILLS_HEIGHT + 32;

  const listRef = useRef<import('react-native').FlatList<Credential>>(null);
  const didInitialScroll = useRef(false);
  const didFocusSaved = useRef<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; httpStatus?: number } | null>(null);
  const [items, setItems] = useState<Credential[]>([]);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [actionExpanded, setActionExpanded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (typeof UIManager.setLayoutAnimationEnabledExperimental !== 'function') return;
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

  const loopedItems = useMemo(() => {
    if (items.length === 0) return [];
    return [...items, ...items, ...items];
  }, [items]);

  const expiringSoonCount = useMemo(() => {
    let count = 0;
    for (const item of items) {
      const expiresAt = item.expires_at;
      if (!expiresAt) continue;
      const days = daysUntil(expiresAt);
      if (typeof days !== 'number') continue;
      if (days >= 0 && days <= EXPIRY_WINDOW_DAYS) count += 1;
    }
    return count;
  }, [items]);

  const actionItems = useMemo<ActionItem[]>(() => {
    const next: ActionItem[] = [];

    const studentInfoNeedsReview = true;
    if (studentInfoNeedsReview) {
      next.push({
        type: 'student_info',
        icon: 'id-card-o',
        title: 'Student info needs review',
        subtitle: 'Update details before sharing credentials.',
        cta: 'Update',
        onPress: () => router.push('/profile'),
      });
    }

    const reviewsNeedingSubmission = ['review_01'];
    if (reviewsNeedingSubmission.length > 0) {
      next.push({
        type: 'review_needed',
        icon: 'star',
        title: 'Review needs submitting',
        subtitle: 'Share feedback on a recent course.',
        cta: 'Leave review',
        onPress: () => router.push('/history'),
      });
    }

    const upcomingCourseThisWeek = { title: 'HLTAID011 Provide First Aid (Refresher)' };
    if (upcomingCourseThisWeek) {
      next.push({
        type: 'upcoming_course',
        icon: 'calendar',
        title: 'Upcoming course this week',
        subtitle: upcomingCourseThisWeek.title,
        cta: 'View',
        onPress: () => router.push('/enrolment'),
      });
    }

    return next;
  }, [router]);

  const actionRows = useMemo<ActionItem[]>(() => {
    if (actionItems.length <= ACTION_ROWS_MAX) return actionItems;

    const visible = actionItems.slice(0, ACTION_ROWS_MAX - 1);
    const hiddenCount = actionItems.length - (ACTION_ROWS_MAX - 1);
    visible.push({
      type: 'more',
      icon: 'ellipsis-h',
      title: 'More actions',
      subtitle: 'View the rest of your action items.',
      cta: `+${hiddenCount} more`,
      onPress: () => router.push('/history'),
    });
    return visible;
  }, [actionItems, router]);

  const loadCredentials = useCallback(async (mode: 'initial' | 'refresh' | 'retry' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const local = await getLocalCredentials();
      let apiItems: Credential[] = [];

      try {
        const payload = (await apiFetch('/api/credentials')) as unknown;
        const data = payload as Partial<CredentialsResponse>;
        apiItems = parseCredentialsResponse(data);
      } catch (apiErr) {
        setError(normalizeApiError(apiErr));
      }

      const merged = mergeCredentials(apiItems, local);

      // Fall back to demo data if no credentials available
      if (merged.length === 0) {
        setItems(DEMO_CREDENTIALS);
      } else {
        setItems(merged);
      }
    } catch (err) {
      // On complete failure, show demo data instead of empty state
      setItems(DEMO_CREDENTIALS);
      setError(normalizeApiError(err));
    } finally {
      if (mode === 'refresh') setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCredentials('initial');
  }, [loadCredentials]);

  useFocusEffect(
    useCallback(() => {
      void loadCredentials('refresh');
    }, [loadCredentials])
  );

  useEffect(() => {
    if (params.toast === 'saved') {
      setBannerVisible(true);
      const id = toastId;
      const timeoutId = setTimeout(() => setBannerVisible(false), 2200);
      didFocusSaved.current = id || null;
      router.setParams({ toast: undefined, id: undefined });
      return () => clearTimeout(timeoutId);
    }
  }, [params.toast, router, toastId]);

  useEffect(() => {
    if (items.length === 0) {
      didInitialScroll.current = false;
      return;
    }
    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: items.length * ITEM_SIZE, animated: false });
    });
  }, [items.length]);

  useEffect(() => {
    if (!didInitialScroll.current) return;
    if (!didFocusSaved.current) return;
    if (items.length === 0) return;

    const idx = items.findIndex((c) => c.id === didFocusSaved.current);
    if (idx < 0) return;

    const targetIndex = items.length + idx;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: targetIndex * ITEM_SIZE, animated: true });
    });
    didFocusSaved.current = null;
  }, [items]);

  const onRefresh = useCallback(() => {
    void loadCredentials('refresh');
  }, [loadCredentials]);

  const onFindTraining = useCallback(async () => {
    const url = buildNeedMoreTrainingUrl({ intent: 'refresher' });
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  }, []);

  const onAddTicket = useCallback(() => {
    router.push('/add');
  }, [router]);

  const onViewAll = useCallback(() => {
    router.push('/history');
  }, [router]);

  const bottomPills = (
    <View pointerEvents="box-none" style={[styles.bottomActionsLayer, { bottom: pillsBottom }]}>
      {/* Add Ticket button - primary blue */}
      <Pressable
        accessibilityRole="button"
        onPress={onAddTicket}
        style={({ pressed }) => [
          styles.addTicketPill,
          pressed ? styles.bottomPillPressed : null,
        ]}
      >
        <FontAwesome name="plus" size={18} color={colors.text.inverse} />
        <Text style={styles.addTicketText}>Add Ticket</Text>
      </Pressable>

      {/* Search Training button - with ST branding */}
      <Pressable
        accessibilityRole="button"
        onPress={onFindTraining}
        style={({ pressed }) => [
          styles.searchTrainingPill,
          pressed ? styles.bottomPillPressed : null,
        ]}
      >
        <View style={styles.stLogo}>
          <FontAwesome name="graduation-cap" size={18} color={colors.text.inverse} />
        </View>
        <View style={styles.stTextContainer}>
          <Text style={styles.stTitle}>Search Training</Text>
          <Text style={styles.stSubtitle}>Australia's Training Marketplace</Text>
        </View>
      </Pressable>
    </View>
  );

  const onBell = useCallback(() => {
    Alert.alert('Coming soon', 'Notifications will appear here in a future update.');
  }, []);

  const toggleActionExpanded = useCallback(() => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {
      // no-op: LayoutAnimation may be unsupported on some platforms
    }
    setActionExpanded((prev) => !prev);
  }, []);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (items.length === 0) return;

      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_SIZE);

      if (index < items.length) {
        const nextIndex = index + items.length;
        listRef.current?.scrollToOffset({ offset: nextIndex * ITEM_SIZE, animated: false });
      } else if (index >= items.length * 2) {
        const nextIndex = index - items.length;
        listRef.current?.scrollToOffset({ offset: nextIndex * ITEM_SIZE, animated: false });
      }
    },
    [items.length]
  );

  const openDetail = useCallback(
    (id: string) => {
      router.push(`/credential/${id}`);
    },
    [router]
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top', 'left', 'right']} testID="home-root" style={styles.safe}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading your wallet…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    if (items.length > 0) {
      // Non-blocking: show what we have (e.g. local-only) and a warning banner.
      return (
        <View style={styles.root}>
          <SafeAreaView edges={['top', 'left', 'right']} testID="home-root" style={styles.safe}>
            <View style={styles.inner}>
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>A</Text>
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.welcome}>Welcome back,</Text>
                    <Text style={styles.name}>Alex Johnson</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications (coming soon)"
                  onPress={onBell}
                  style={({ pressed }) => [styles.iconCircle, pressed ? styles.iconCirclePressed : null]}
                >
                  <FontAwesome name="bell-o" size={18} color={colors.text.primary} />
                </Pressable>
              </View>

              {actionItems.length > 0 && (
                <View style={styles.actionSection}>
                  <View style={styles.actionCard}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={toggleActionExpanded}
                      style={({ pressed }) => [
                        styles.actionAccordionHeader,
                        actionExpanded ? styles.actionAccordionHeaderExpanded : null,
                        pressed ? styles.actionAccordionHeaderPressed : null,
                      ]}
                    >
                      <View style={styles.actionAccordionHeaderText}>
                        <Text style={styles.actionSectionTitle}>Action Required</Text>
                        <Text style={styles.actionSectionSubtitle}>
                          {actionItems.length} item{actionItems.length === 1 ? '' : 's'} need attention
                        </Text>
                      </View>
                      <FontAwesome
                        name={actionExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={colors.text.muted}
                      />
                    </Pressable>

                    {actionExpanded && (
                      <View>
                        {actionRows.map((item, index) => (
                          <View
                            key={`${item.type}-${index}`}
                            style={[styles.actionRow, index > 0 ? styles.actionRowDivider : null]}
                          >
                            <View style={styles.actionCardLeft}>
                              <View style={styles.actionBadge}>
                                <FontAwesome name={item.icon} size={14} color={colors.warning} />
                              </View>
                              <View style={styles.actionCardText}>
                                <Text style={styles.actionCardTitle}>{item.title}</Text>
                                <Text style={styles.actionCardSubtitle}>{item.subtitle}</Text>
                              </View>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              onPress={item.onPress}
                              style={({ pressed }) => [styles.actionCta, pressed ? styles.actionCtaPressed : null]}
                            >
                              <Text style={styles.actionCtaText}>{item.cta}</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.titleRow}>
                <View style={styles.titleLeft}>
                  <View style={styles.titleIcon}>
                    <FontAwesome name="ticket" size={14} color={colors.text.inverse} />
                  </View>
                  <Text style={styles.pageTitle}>My Tickets</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={onViewAll} style={styles.viewAll}>
                  <Text style={styles.viewAllText}>View all</Text>
                </Pressable>
              </View>

              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  {typeof error.httpStatus === 'number'
                    ? `Sync issue (HTTP ${error.httpStatus}) — showing local credentials`
                    : 'Sync issue — showing local credentials'}
                </Text>
              </View>

              <Animated.FlatList
                ref={listRef}
                data={loopedItems}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                testID="home-content"
                contentContainerStyle={[styles.listContent, { paddingBottom: contentBottomPadding }]}
                snapToInterval={ITEM_SIZE}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                scrollEventThrottle={16}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                  useNativeDriver: true,
                })}
                getItemLayout={(_data, index) => ({
                  length: ITEM_SIZE,
                  offset: ITEM_SIZE * index,
                  index,
                })}
                renderItem={({ item, index }) => {
                  const inputRange = [
                    (index - 1) * ITEM_SIZE,
                    index * ITEM_SIZE,
                    (index + 1) * ITEM_SIZE,
                  ];
                  const scale = scrollY.interpolate({
                    inputRange,
                    outputRange: [0.94, 1, 0.94],
                    extrapolate: 'clamp',
                  });
                  const translateY = scrollY.interpolate({
                    inputRange,
                    outputRange: [18, 0, 18],
                    extrapolate: 'clamp',
                  });
                  const opacity = scrollY.interpolate({
                    inputRange,
                    outputRange: [0.9, 1, 0.9],
                    extrapolate: 'clamp',
                  });

                  return (
                    <View style={styles.itemWrap}>
                      <Animated.View style={[styles.cardWrap, { transform: [{ scale }, { translateY }], opacity }]}>
                        <CredentialCard credential={item} onPress={() => openDetail(item.id)} />
                      </Animated.View>
                    </View>
                  );
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              />
            </View>

            {bottomPills}
          </SafeAreaView>
        </View>
      );
    }

    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top', 'left', 'right']} testID="home-root" style={styles.safe}>
          <ScrollView
            testID="home-content"
            contentContainerStyle={[styles.emptyContainer, { paddingBottom: contentBottomPadding }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.welcome}>Welcome back,</Text>
                  <Text style={styles.name}>Alex Johnson</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications (coming soon)"
                onPress={onBell}
                style={({ pressed }) => [styles.iconCircle, pressed ? styles.iconCirclePressed : null]}
              >
                <FontAwesome name="bell-o" size={18} color={colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <View style={styles.titleIcon}>
                  <FontAwesome name="ticket" size={14} color={colors.text.inverse} />
                </View>
                <Text style={styles.pageTitle}>My Tickets</Text>
              </View>
            </View>

            <View style={[styles.panel, styles.errorPanel]}>
              <Text style={styles.panelTitle}>Couldn’t load credentials</Text>
              <Text style={styles.panelBody}>
                {typeof error.httpStatus === 'number' ? `HTTP ${error.httpStatus}: ${error.message}` : error.message}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => loadCredentials('retry')}
                style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.buttonText}>Retry</Text>
              </Pressable>
            </View>
          </ScrollView>

          {bottomPills}
        </SafeAreaView>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top', 'left', 'right']} testID="home-root" style={styles.safe}>
          <ScrollView
            testID="home-content"
            contentContainerStyle={[styles.emptyContainer, { paddingBottom: contentBottomPadding }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.welcome}>Welcome back,</Text>
                  <Text style={styles.name}>Alex Johnson</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications (coming soon)"
                onPress={onBell}
                style={({ pressed }) => [styles.iconCircle, pressed ? styles.iconCirclePressed : null]}
              >
                <FontAwesome name="bell-o" size={18} color={colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <View style={styles.titleIcon}>
                  <FontAwesome name="ticket" size={14} color={colors.text.inverse} />
                </View>
                <Text style={styles.pageTitle}>My Tickets</Text>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>No credentials yet</Text>
              <Text style={styles.panelBody}>
                No credentials yet. Your tickets will appear here after you complete training.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onFindTraining}
                style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.buttonText}>Find training</Text>
              </Pressable>
            </View>
          </ScrollView>

          {bottomPills}
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'left', 'right']} testID="home-root" style={styles.safe}>
        <View style={styles.inner}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.welcome}>Welcome back,</Text>
                <Text style={styles.name}>Alex Johnson</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => router.push('/profile')}
                style={({ pressed }) => [styles.iconCircle, pressed ? styles.iconCirclePressed : null]}
              >
                <FontAwesome name="cog" size={18} color={colors.text.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={onBell}
                style={({ pressed }) => [styles.iconCircle, pressed ? styles.iconCirclePressed : null]}
              >
                <FontAwesome name="bell-o" size={18} color={colors.text.primary} />
                <View style={styles.notificationDot} />
              </Pressable>
            </View>
          </View>

          {actionItems.length > 0 && (
            <View style={styles.actionSection}>
              <View style={styles.actionCard}>
                <Pressable
                  accessibilityRole="button"
                  onPress={toggleActionExpanded}
                  style={({ pressed }) => [
                    styles.actionAccordionHeader,
                    actionExpanded ? styles.actionAccordionHeaderExpanded : null,
                    pressed ? styles.actionAccordionHeaderPressed : null,
                  ]}
                >
                  <View style={styles.actionAccordionHeaderText}>
                    <Text style={styles.actionSectionTitle}>Action Required</Text>
                    <Text style={styles.actionSectionSubtitle}>
                      {actionItems.length} item{actionItems.length === 1 ? '' : 's'} need attention
                    </Text>
                  </View>
                  <FontAwesome
                    name={actionExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.text.muted}
                  />
                </Pressable>

                {actionExpanded && (
                  <View>
                    {actionRows.map((item, index) => (
                      <View
                        key={`${item.type}-${index}`}
                        style={[styles.actionRow, index > 0 ? styles.actionRowDivider : null]}
                      >
                        <View style={styles.actionCardLeft}>
                          <View style={styles.actionBadge}>
                            <FontAwesome name={item.icon} size={14} color={colors.warning} />
                          </View>
                          <View style={styles.actionCardText}>
                            <Text style={styles.actionCardTitle}>{item.title}</Text>
                            <Text style={styles.actionCardSubtitle}>{item.subtitle}</Text>
                          </View>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          onPress={item.onPress}
                          style={({ pressed }) => [styles.actionCta, pressed ? styles.actionCtaPressed : null]}
                        >
                          <Text style={styles.actionCtaText}>{item.cta}</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <View style={styles.titleIcon}>
                <FontAwesome name="ticket" size={14} color={colors.text.inverse} />
              </View>
              <Text style={styles.pageTitle}>My Tickets</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onViewAll} style={styles.viewAll}>
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          </View>

          {bannerVisible && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>Saved to your wallet</Text>
            </View>
          )}

          <Animated.FlatList
            ref={listRef}
            data={loopedItems}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            testID="home-content"
            contentContainerStyle={[styles.listContent, { paddingBottom: contentBottomPadding }]}
            snapToInterval={ITEM_SIZE}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            scrollEventThrottle={16}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })}
            getItemLayout={(_data, index) => ({
              length: ITEM_SIZE,
              offset: ITEM_SIZE * index,
              index,
            })}
            renderItem={({ item, index }) => {
              const inputRange = [(index - 1) * ITEM_SIZE, index * ITEM_SIZE, (index + 1) * ITEM_SIZE];
              const scale = scrollY.interpolate({
                inputRange,
                outputRange: [0.94, 1, 0.94],
                extrapolate: 'clamp',
              });
              const translateY = scrollY.interpolate({
                inputRange,
                outputRange: [18, 0, 18],
                extrapolate: 'clamp',
              });
              const opacity = scrollY.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: 'clamp',
              });
              return (
                <View style={styles.itemWrap}>
                  <Animated.View style={[styles.cardWrap, { transform: [{ scale }, { translateY }], opacity }]}>
                    <CredentialCard credential={item} onPress={() => openDetail(item.id)} />
                  </Animated.View>
                </View>
              );
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />

        </View>

        {bottomPills}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.app,
    position: 'relative',
  },
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    gap: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text.inverse,
    fontWeight: '900',
    fontSize: fontSizes.lg,
  },
  welcome: {
    color: colors.text.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
  name: {
    color: colors.text.primary,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    lineHeight: 28,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  iconCirclePressed: {
    opacity: 0.9,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: colors.bg.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: colors.text.primary,
    fontSize: fontSizes.xl,
    fontWeight: '900',
  },
  actionBanner: {
    borderRadius: radii.xl,
    padding: spacing.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  actionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    gap: 2,
  },
  actionTitle: {
    color: colors.text.primary,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  actionBody: {
    color: colors.text.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: '#E0F2FE',
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionButtonText: {
    color: colors.brand.blueDeep,
    fontWeight: '900',
    fontSize: fontSizes.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  viewAll: {
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
  },
  viewAllText: {
    color: colors.brand.blueDeep,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: fontSizes.xs,
  },
  actionSection: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actionSectionTitle: {
    color: colors.text.primary,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  actionSectionSubtitle: {
    color: colors.text.muted,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
  actionCard: {
    borderRadius: ACTION_CARD_RADIUS,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.soft,
  },
  actionAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.bg.surface,
  },
  actionAccordionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionAccordionHeaderPressed: {
    backgroundColor: colors.bg.surfaceMuted,
  },
  actionAccordionHeaderText: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.bg.surface,
  },
  actionRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  actionBadge: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    flex: 1,
    gap: 2,
  },
  actionCardTitle: {
    color: colors.text.primary,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  actionCardSubtitle: {
    color: colors.text.muted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    lineHeight: 16,
  },
  actionCta: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: '#E0F2FE',
  },
  actionCtaPressed: {
    opacity: 0.9,
  },
  actionCtaText: {
    color: colors.brand.blueDeep,
    fontWeight: '900',
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toast: {
    marginBottom: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  toastText: {
    color: colors.text.primary,
    fontWeight: '900',
  },
  warningBanner: {
    marginBottom: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: {
    color: colors.text.primary,
    fontWeight: '900',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  loadingText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 10,
  },
  itemWrap: {
    height: ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrap: {
    width: '100%',
    maxWidth: MAX_CARD_WIDTH,
  },
  bottomActionsLayer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  // Add Ticket pill - compact primary style
  addTicketPill: {
    height: PILLS_HEIGHT,
    borderRadius: radii.pill,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.brand.blue,
    ...shadows.card,
  },
  addTicketText: {
    color: colors.text.inverse,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  // Search Training pill - expanded with ST branding
  searchTrainingPill: {
    flex: 1,
    height: PILLS_HEIGHT,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  stLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.searchTraining,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  stTextContainer: {
    flex: 1,
    gap: 1,
  },
  stTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  stSubtitle: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  bottomPillPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  fabLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  fabRow: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.9)',
    ...shadows.soft,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  pillPrimary: {
    backgroundColor: colors.brand.blue,
  },
  pillPrimaryText: {
    color: colors.text.inverse,
    fontWeight: '900',
    fontSize: fontSizes.sm,
  },
  pillSurface: {
    backgroundColor: colors.bg.surface,
  },
  pillSurfaceText: {
    color: colors.brand.blueDeep,
    fontWeight: '900',
    fontSize: fontSizes.sm,
  },
  pillPressed: {
    opacity: 0.9,
  },
  panel: {
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorPanel: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B1220',
  },
  panelBody: {
    marginTop: 8,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#0E89BA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
