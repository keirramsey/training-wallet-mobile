import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CARD_HEIGHT, CARD_HEIGHT_COLLAPSED, CredentialCard } from '@/components/CredentialCard';
import { apiFetch } from '@/src/lib/api';
import { getLocalCredentials } from '@/src/storage/credentialsStore';
import { DEMO_CREDENTIALS, DEMO_USER, inferColorTheme, inferStatus } from '@/src/data/demoCredentials';
import { getActionCounts, mergeCredentials, parseCredentials } from '@/src/lib/credentialUtils';
import type { Credential } from '@/src/types/credential';
import {
  accessibility,
  cardThemes,
  colors,
  fontSizes,
  layout,
  pressedState,
  radii,
  shadows,
  spacing,
  statusColors,
} from '@/src/theme/tokens';

const COLLAPSED_HEIGHT = CARD_HEIGHT_COLLAPSED;
const EXPANDED_HEIGHT = CARD_HEIGHT;
const PILLS_HEIGHT = 56;
const CAROUSEL_WINDOW = 5;
const CAROUSEL_SWIPE_THRESHOLD = 36;
const CAROUSEL_OVERLAP = 16;
const CAROUSEL_STACK_HEIGHT =
  EXPANDED_HEIGHT + (CAROUSEL_WINDOW - 1) * (COLLAPSED_HEIGHT - CAROUSEL_OVERLAP);

const wrapIndex = (index: number, length: number) => {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
};

// Search Training Logo
const SearchTrainingLogo = ({ size = 30 }: { size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Defs>
        <SvgLinearGradient id="searchTrainingGradient" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#2BC9F4" />
          <Stop offset="1" stopColor="#0E89BA" />
        </SvgLinearGradient>
      </Defs>
      <Rect width="44" height="44" rx="10" fill="url(#searchTrainingGradient)" />
      <Circle cx="20" cy="20" r="11" fill="white" fillOpacity="0.15" />
      <Circle cx="20" cy="20" r="11" stroke="white" strokeWidth="4.5" fill="none" />
      <Path d="M28 28L36 36" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <Path d="M15 15C16.5 13.5 18.5 13 20 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.9" />
    </Svg>
  );
};

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(2); // Center card starts active
  const [demoMode, setDemoMode] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(false);

  // User data (from API or demo)
  const [userData] = useState(DEMO_USER);

  const load = useCallback(async () => {
    let usingDemo = false;
    try {
      setLoading(true);
      setError(null);

      const [local, apiResult] = await Promise.allSettled([
        getLocalCredentials(),
        apiFetch('/api/credentials'),
      ]);

      const localItems = local.status === 'fulfilled' ? local.value : [];
      let apiItems: Credential[] = [];

      if (apiResult.status === 'fulfilled') {
        try {
          apiItems = parseCredentials(apiResult.value);
        } catch (apiErr) {
          console.log('[WalletScreen] API parse error:', apiErr);
        }
      }

      const merged = mergeCredentials(apiItems, localItems);
      if (merged.length === 0) {
        usingDemo = true;
        setItems(DEMO_CREDENTIALS);
      } else {
        setItems(merged);
      }
    } catch (err) {
      usingDemo = true;
      setItems(DEMO_CREDENTIALS);
      setError({ message: 'Could not load credentials' });
      console.log('[WalletScreen] Load error, using demo data:', err);
    } finally {
      setDemoMode(usingDemo);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const carouselItems = useMemo(() => {
    if (items.length >= CAROUSEL_WINDOW) {
      return items;
    }
    const seen = new Set(items.map((item) => item.id));
    const fillers = DEMO_CREDENTIALS.filter((item) => !seen.has(item.id));
    return [...items, ...fillers].slice(0, CAROUSEL_WINDOW);
  }, [items]);

  useEffect(() => {
    if (carouselItems.length === 0) return;
    setCarouselIndex((current) => wrapIndex(current, carouselItems.length));
  }, [carouselItems.length]);

  // Calculate action counts for dynamic banner (always use full items list)
  const actionCounts = useMemo(() => {
    const creds = items.length > 0 ? items : DEMO_CREDENTIALS;
    const counts = getActionCounts(creds);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[WalletScreen] actionCounts: expired=${counts.expired}, expiringSoon=${counts.expiringSoon}, processing=${counts.processing}, total=${counts.total} (from ${creds.length} credentials)`);
    }
    return counts;
  }, [items]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const [carouselDragging, setCarouselDragging] = useState(false);
  const dragStepOffset = useRef(0);

  const onAddTicket = useCallback(() => {
    triggerHaptic();
    router.push('/add/upload');
  }, [router, triggerHaptic]);

  const onFindTraining = useCallback(() => {
    triggerHaptic();
    router.push('/(tabs)/courses');
  }, [router, triggerHaptic]);

  const onViewAll = useCallback(() => {
    triggerHaptic();
    router.push('/(tabs)/history');
  }, [router, triggerHaptic]);

  const onNotifications = useCallback(() => {
    triggerHaptic();
    router.push('/notifications');
  }, [router, triggerHaptic]);

  const onToggleBanner = useCallback(() => {
    setBannerExpanded((current) => !current);
  }, []);

  const onProfile = useCallback(() => {
    router.push('/profile');
  }, [router]);

  const onCardNavigate = useCallback((id: string) => {
    triggerHaptic();
    router.push(`/credential/${id}`);
  }, [router, triggerHaptic]);

  const carouselWindowSize = useMemo(
    () => Math.min(CAROUSEL_WINDOW, carouselItems.length),
    [carouselItems.length]
  );
  const activeIndex = Math.floor(carouselWindowSize / 2);

  const displayItems = useMemo(() => {
    if (carouselItems.length === 0) return [];
    const centerOffset = Math.floor(carouselWindowSize / 2);

    return Array.from({ length: carouselWindowSize }, (_, offset) => {
      const itemIndex = wrapIndex(carouselIndex + offset - centerOffset, carouselItems.length);
      return { item: carouselItems[itemIndex], itemIndex };
    });
  }, [carouselItems, carouselIndex, carouselWindowSize]);

  const onActivateCard = useCallback((itemIndex: number) => {
    if (itemIndex === carouselIndex) return;
    triggerHaptic();
    setCarouselIndex(itemIndex);
  }, [carouselIndex, triggerHaptic]);

  const stepCarousel = useCallback((direction: 'next' | 'prev') => {
    if (carouselItems.length <= 1) return;
    triggerHaptic();
    setCarouselIndex((current) =>
      wrapIndex(current + (direction === 'next' ? 1 : -1), carouselItems.length)
    );
  }, [carouselItems.length, triggerHaptic]);

  const wheelAccumulator = useRef(0);
  const carouselRef = useRef<View>(null);

  // Web-only wheel event handler - attached via useEffect to avoid TypeScript errors
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = carouselRef.current as unknown as HTMLElement | null;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      const deltaY = event.deltaY;
      if (!deltaY) return;

      wheelAccumulator.current += deltaY;
      if (Math.abs(wheelAccumulator.current) < 60) return;

      const direction = wheelAccumulator.current > 0 ? 'prev' : 'next';
      wheelAccumulator.current = 0;
      stepCarousel(direction);
      event.preventDefault();
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [stepCarousel]);

  const carouselPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
    onMoveShouldSetPanResponderCapture: (_, gestureState) =>
      Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
    onPanResponderGrant: () => {
      dragStepOffset.current = 0;
      setCarouselDragging(true);
    },
    onPanResponderMove: (_, gestureState) => {
      const delta = gestureState.dy - dragStepOffset.current;
      if (Math.abs(delta) < CAROUSEL_SWIPE_THRESHOLD) return;
      stepCarousel(delta > 0 ? 'prev' : 'next');
      dragStepOffset.current = gestureState.dy;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (dragStepOffset.current === 0) {
        if (gestureState.dy > CAROUSEL_SWIPE_THRESHOLD) {
          stepCarousel('prev');
        } else if (gestureState.dy < -CAROUSEL_SWIPE_THRESHOLD) {
          stepCarousel('next');
        }
      }
      dragStepOffset.current = 0;
      setCarouselDragging(false);
    },
    onPanResponderTerminate: () => {
      dragStepOffset.current = 0;
      setCarouselDragging(false);
    },
  }), [stepCarousel]);

  return (
    <View style={styles.container} testID="home-root">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: userData.avatarUrl }} style={styles.avatar} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userData.name}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={onNotifications}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open inbox"
            hitSlop={accessibility.hitSlop}
          >
            <FontAwesome5 name="envelope" size={18} color={colors.text.primary} />
            <View style={styles.badge} />
          </Pressable>
          <Pressable
            onPress={onProfile}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={accessibility.hitSlop}
          >
            <FontAwesome5 name="user-circle" size={20} color={colors.text.primary} solid />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: PILLS_HEIGHT + spacing.xs + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        testID="home-content"
        scrollEnabled={!carouselDragging}
      >
        {demoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Demo mode · showing sample credentials</Text>
          </View>
        )}

        {/* Dynamic Action Banner */}
        {actionCounts.total > 0 && (
          <View style={styles.actionBanner}>
            <View style={styles.bannerHeader}>
              <Pressable
                onPress={onToggleBanner}
                style={({ pressed }) => [styles.bannerToggle, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Toggle action required details"
              >
                <View style={styles.bannerContent}>
                  <View style={styles.warningIcon}>
                    <FontAwesome5 name="exclamation-triangle" size={16} color={colors.warning} />
                  </View>
                  <View style={styles.bannerText}>
                    <Text style={styles.bannerTitle}>Action Required</Text>
                    <Text style={styles.bannerSubtitle}>
                      {actionCounts.expiringSoon > 0
                        ? `${actionCounts.expiringSoon} ticket${actionCounts.expiringSoon > 1 ? 's' : ''} expiring soon`
                        : actionCounts.expired > 0
                        ? `${actionCounts.expired} expired credential${actionCounts.expired > 1 ? 's' : ''}`
                        : 'Review your credentials'}
                    </Text>
                  </View>
                </View>
              </Pressable>
              <View style={styles.bannerActions}>
                <Pressable
                  onPress={onViewAll}
                  style={({ pressed }) => [styles.reviewButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Review credentials"
                >
                  <Text style={styles.reviewButtonText}>Review</Text>
                </Pressable>
                <Pressable
                  onPress={onToggleBanner}
                  accessibilityRole="button"
                  accessibilityLabel={bannerExpanded ? 'Collapse details' : 'Expand details'}
                  hitSlop={accessibility.hitSlop}
                  style={({ pressed }) => [styles.chevronButton, pressed && styles.pressed]}
                >
                  <FontAwesome5
                    name={bannerExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.text.muted}
                  />
                </Pressable>
              </View>
            </View>
            {bannerExpanded && (
              <View style={styles.bannerDetails}>
                {actionCounts.expired > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expired credentials</Text>
                    <Text style={styles.detailValue}>{actionCounts.expired}</Text>
                  </View>
                )}
                {actionCounts.expiringSoon > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expiring soon</Text>
                    <Text style={styles.detailValue}>{actionCounts.expiringSoon}</Text>
                  </View>
                )}
                {actionCounts.processing > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Processing</Text>
                    <Text style={styles.detailValue}>{actionCounts.processing}</Text>
                  </View>
                )}
                <View style={styles.detailActions}>
                  <Pressable
                    onPress={onViewAll}
                    style={({ pressed }) => [styles.detailButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Go to history"
                  >
                    <Text style={styles.detailButtonText}>Go to History</Text>
                  </Pressable>
                  <Pressable
                    onPress={onNotifications}
                    style={({ pressed }) => [styles.detailButtonSecondary, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Open inbox"
                  >
                    <Text style={styles.detailButtonSecondaryText}>Open Inbox</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Tickets</Text>
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel="View all credentials"
            hitSlop={accessibility.hitSlop}
          >
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </Pressable>
        </View>

        <View style={styles.carouselArea}>
          <View style={styles.carouselWrapper}>
            <View
              ref={carouselRef}
              style={styles.carouselContainer}
              testID="wallet-carousel"
              {...carouselPanResponder.panHandlers}
            >
              {loading ? (
                <ActivityIndicator size="large" color={colors.brand.blue} />
              ) : error && items.length === 0 ? (
                <View style={styles.errorState}>
                  <FontAwesome5 name="exclamation-circle" size={32} color={colors.text.muted} />
                  <Text style={styles.errorText}>{error.message}</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  {displayItems.map(({ item, itemIndex }, index) => (
                    <CarouselItemUnified
                      key={`${item.id}-${itemIndex}`}
                      item={item}
                      index={index}
                      activeIndex={activeIndex}
                      isActive={index === activeIndex}
                      onActivate={() => onActivateCard(itemIndex)}
                      onNavigate={() => onCardNavigate(item.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Pills - with padding to not overlap content */}
      <View style={[styles.bottomPills, { bottom: insets.bottom + spacing.sm }]}>
        <Pressable
          onPress={onAddTicket}
          style={({ pressed }) => [styles.pillItem, styles.pillItemLeft, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Add new ticket"
        >
          <LinearGradient
            colors={[colors.brand.cyan, colors.brand.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addTicketButton}
          >
            <FontAwesome5 name="plus" size={16} color={colors.text.inverse} />
            <Text style={styles.addTicketText}>Add Ticket</Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.searchButton, styles.pillItem, pressed && styles.pressed]}
          onPress={onFindTraining}
          accessibilityRole="button"
          accessibilityLabel="Search for training courses"
        >
          <SearchTrainingLogo size={30} />
          <Text style={styles.searchTitle}>Search Training</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Collapsed card view
const CollapsedCard = ({ credential, onPress }: { credential: Credential; onPress: () => void }) => {
  const themeKey = credential.colorTheme ?? inferColorTheme(credential) ?? 'cyan';
  const theme = cardThemes[themeKey as keyof typeof cardThemes] ?? cardThemes.cyan;
  const status = inferStatus(credential) ?? 'unverified';
  const statusConfig = statusColors[status as keyof typeof statusColors] ?? statusColors.unverified;

  const category = credential.category || 'Credential';
  const title = credential.title || 'Unknown';
  const statusLabel =
    status === 'verified' || status === 'validated'
      ? 'Verified'
      : status === 'expired'
      ? 'Expired'
      : status === 'processing'
      ? 'Processing'
      : 'Unverified';

  const dateStr = credential.expires_at
    ? new Date(credential.expires_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
    : credential.issued_at
    ? new Date(credential.issued_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
    : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.collapsedCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${statusLabel}`}
    >
      <LinearGradient
        colors={[theme.from, theme.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.collapsedCardGradient}
      >
        <View style={styles.collapsedCardContent}>
          <View style={styles.collapsedCardLeft}>
            <Text style={styles.collapsedCategory}>{category.toUpperCase()}</Text>
            <Text style={styles.collapsedTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View style={styles.collapsedCardRight}>
            <Text style={styles.collapsedStatusLabel}>{statusLabel.toUpperCase()}</Text>
            <Text style={styles.collapsedDate}>{dateStr}</Text>
          </View>
          <View
            style={[
              styles.collapsedStatusIcon,
              { backgroundColor: statusConfig.bg, borderColor: statusConfig.border },
            ]}
          >
            <FontAwesome
              name={
                status === 'verified' || status === ('validated' as string)
                  ? 'check'
                  : status === 'expired'
                  ? 'times'
                  : status === 'processing'
                  ? 'clock-o'
                  : 'exclamation'
              }
              size={12}
              color={statusConfig.text}
            />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const CarouselItemUnified = ({
  item,
  index,
  activeIndex,
  isActive,
  onActivate,
  onNavigate,
}: {
  item: Credential;
  index: number;
  activeIndex: number;
  isActive: boolean;
  onActivate: () => void;
  onNavigate: () => void;
}) => {
  const absDistance = Math.abs(index - activeIndex);
  const scale = absDistance === 0 ? 1.0 : absDistance === 1 ? 0.92 : 0.85;
  const opacity = absDistance === 0 ? 1.0 : absDistance === 1 ? 0.7 : 0.4;
  const translateY = absDistance === 0 ? 0 : absDistance === 1 ? 6 : 12;
  const zIndex = absDistance === 0 ? 30 : absDistance === 1 ? 20 : 10;
  const containerHeight = isActive ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;

  const scaleAnim = useRef(new Animated.Value(scale)).current;
  const opacityAnim = useRef(new Animated.Value(opacity)).current;
  const translateAnim = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: scale,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: opacity,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: translateY,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, opacityAnim, scale, scaleAnim, translateAnim, translateY]);

  const handlePress = useCallback(() => {
    if (isActive) {
      onNavigate();
      return;
    }
    onActivate();
  }, [isActive, onActivate, onNavigate]);

  return (
    <View
      style={[
        styles.itemContainer,
        {
          height: containerHeight,
          zIndex,
          marginTop: index === 0 ? 0 : -CAROUSEL_OVERLAP,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.cardShadowWrapper,
          {
            height: containerHeight,
            transform: [{ scale: scaleAnim }, { translateY: translateAnim }],
            opacity: opacityAnim,
            maxWidth: layout.cardMaxWidth,
          },
        ]}
      >
        {isActive ? (
          <CredentialCard credential={item} onPress={handlePress} />
        ) : (
          <CollapsedCard credential={item} onPress={handlePress} />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.surfaceMuted,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(43, 201, 244, 0.2)',
  },
  avatar: { width: '100%', height: '100%' },
  headerText: { gap: 2 },
  welcomeText: { fontSize: fontSizes.xs, color: colors.text.muted, fontWeight: '600' },
  userName: { fontSize: fontSizes.lg, color: colors.text.primary, fontWeight: '800' },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: accessibility.touchTarget,
    height: accessibility.touchTarget,
    borderRadius: accessibility.touchTarget / 2,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadows.soft,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },

  actionBanner: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    zIndex: 50, // Ensure banner stays above cards
    ...shadows.soft,
  },
  demoBanner: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(14, 137, 186, 0.12)',
  },
  demoBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.blue,
  },
  bannerHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  bannerToggle: {
    flex: 1,
  },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bannerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { gap: 2 },
  bannerTitle: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.text.primary },
  bannerSubtitle: { fontSize: fontSizes.xs, color: colors.text.muted, fontWeight: '600' },
  reviewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(43, 201, 244, 0.1)',
    borderRadius: radii.pill,
  },
  reviewButtonText: { fontSize: fontSizes.xs, fontWeight: '800', color: colors.brand.blue },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surfaceMuted,
  },
  bannerDetails: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.text.primary,
  },
  detailActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  detailButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(43, 201, 244, 0.15)',
    alignItems: 'center',
  },
  detailButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.brand.blue,
  },
  detailButtonSecondary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.bg.surfaceMuted,
    alignItems: 'center',
  },
  detailButtonSecondaryText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text.primary,
  },

  sectionHeader: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    zIndex: 40, // Stay above carousel cards
  },
  sectionTitle: { fontSize: fontSizes.xl, fontWeight: '900', color: colors.text.primary },
  viewAllText: { fontSize: fontSizes.xs, fontWeight: '800', color: colors.brand.blue },

  carouselArea: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  carouselWrapper: {
    position: 'relative',
    zIndex: 1,
    marginTop: spacing.xxl + spacing.sm,
    height: CAROUSEL_STACK_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
  },
  carouselContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  itemContainer: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardShadowWrapper: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },

  errorState: {
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    color: colors.text.muted,
    fontWeight: '600',
  },

  collapsedCard: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  collapsedCardGradient: {
    flex: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedCardLeft: {
    flex: 1,
    gap: 2,
  },
  collapsedCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.8,
  },
  collapsedTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  collapsedCardRight: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  collapsedStatusLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  collapsedDate: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  collapsedStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  bottomPills: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillItem: {
    flex: 1,
  },
  pillItemLeft: {
    marginRight: spacing.md,
  },
  addTicketButton: {
    height: PILLS_HEIGHT,
    borderRadius: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    ...shadows.soft,
  },
  addTicketText: { color: colors.text.inverse, fontWeight: '700', fontSize: fontSizes.sm },
  searchButton: {
    height: PILLS_HEIGHT,
    backgroundColor: colors.bg.surface,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  searchTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text.primary,
    flexShrink: 1,
    textAlign: 'center',
  },

  pressed: {
    opacity: pressedState.opacity,
    transform: [{ scale: pressedState.scale }],
  },
});
