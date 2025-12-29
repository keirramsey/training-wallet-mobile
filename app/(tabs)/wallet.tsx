import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { CredentialCard } from '@/components/CredentialCard';
import { apiFetch } from '@/src/lib/api';
import { getLocalCredentials } from '@/src/storage/credentialsStore';
import { DEMO_CREDENTIALS, inferColorTheme, inferStatus } from '@/src/data/demoCredentials';
import type { Credential } from '@/src/types/credential';
import { cardThemes, colors, fontSizes, radii, shadows, spacing, statusColors } from '@/src/theme/tokens';

// Search Training Logo - Variant 04 (Header/Nav style - exact SVG from brand sheet)
const SearchTrainingLogo = ({ size = 36 }: { size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Defs>
        <SvgLinearGradient id="brandGradHeader" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#2BC9F4" />
          <Stop offset="1" stopColor="#0E89BA" />
        </SvgLinearGradient>
      </Defs>
      {/* Rounded square background */}
      <Rect width="44" height="44" rx="10" fill="url(#brandGradHeader)" />
      {/* Lens fill (semi-transparent) */}
      <Circle cx="20" cy="20" r="11" fill="white" fillOpacity="0.15" />
      {/* Lens stroke */}
      <Circle cx="20" cy="20" r="11" stroke="white" strokeWidth="4.5" fill="none" />
      {/* Handle */}
      <Path d="M28 28L36 36" stroke="white" strokeWidth="5" strokeLinecap="round" />
      {/* Highlight */}
      <Path d="M15 15C16.5 13.5 18.5 13 20 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.9" />
    </Svg>
  );
};

const COLLAPSED_HEIGHT = 70; // Collapsed card height (matches cardTokens.collapsed.height)
const EXPANDED_HEIGHT = 220; // Full card height (matches CredentialCard expanded)
const ITEM_HEIGHT = 100; // Snap interval - slightly larger than collapsed for overlap
const CONTAINER_HEIGHT = 520; // Viewport height
const VISIBLE_ITEMS = 5;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PILLS_HEIGHT = 56;
const IS_WEB = Platform.OS === 'web';
const CARD_GUTTER = 48;

type CarouselCellProps = ComponentProps<typeof View>;

const CarouselCell = ({ children, style, ...props }: CarouselCellProps) => (
  <View {...props} style={[style, styles.cellContainer]}>
    {children}
  </View>
);

// Helper to merge remote + local credentials
function mergeCredentials(remote: Credential[], local: Credential[]): Credential[] {
  const map = new Map<string, Credential>();
  for (const r of remote) map.set(r.id, r);
  for (const l of local) map.set(l.id, l);
  return Array.from(map.values()).sort((a, b) => {
    const da = a.issued_at ? new Date(a.issued_at).getTime() : 0;
    const db = b.issued_at ? new Date(b.issued_at).getTime() : 0;
    return db - da; // Newest first
  });
}

function normalizeApiError(err: unknown): { message: string; httpStatus?: number } {
  const anyErr = err as { message?: unknown; status?: unknown };
  const message = typeof anyErr.message === 'string' ? anyErr.message : 'Unknown error';
  const httpStatus = typeof anyErr.status === 'number' ? anyErr.status : undefined;
  return { message, httpStatus };
}

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const [items, setItems] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [activeIndex, setActiveIndex] = useState(0); // Track which card is centered
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<{ message: string; httpStatus?: number } | null>(null);

  const load = useCallback(async (mode: 'init' | 'refresh' = 'init') => {
    try {
      if (mode === 'init') setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [local, apiResult] = await Promise.allSettled([
        getLocalCredentials(),
        apiFetch<Credential[]>('/api/credentials'),
      ]);

      const localItems = local.status === 'fulfilled' ? local.value : [];
      let apiItems: Credential[] = [];

      if (apiResult.status === 'fulfilled') {
        apiItems = apiResult.value;
      } else {
        const apiErr = apiResult.reason;
        console.log('[WalletScreen] API load failed:', apiErr);
        setError(normalizeApiError(apiErr));
      }

      const merged = mergeCredentials(apiItems, localItems);
      const baseItems = merged.length === 0 ? DEMO_CREDENTIALS : merged;

      // Duplicate for loop (3x)
      let loopedItems = [...baseItems];
      if (baseItems.length > 0) {
         loopedItems = [...baseItems, ...baseItems, ...baseItems]; 
      }
      setItems(loopedItems);

    } catch (err) {
      setItems(DEMO_CREDENTIALS);
      setError(normalizeApiError(err));
    } finally {
      if (mode === 'refresh') setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('init');
  }, [load]);

  const onRefresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  const onAddTicket = () => router.push('/(tabs)/history');
  const onFindTraining = () => router.push('/(tabs)/courses');
  const onCardNavigate = (id: string) => router.push(`/credential/${id}`);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Web scroll handler to track active index
  const handleWebScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newIndex = Math.round(offsetY / ITEM_HEIGHT);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < items.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, items.length]);

  const verticalPadding = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;
  const cardWidth = Math.max(containerWidth - CARD_GUTTER, 0);

  const onCarouselLayout = useCallback((event: { nativeEvent: { layout: { width: number } } }) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  }, [containerWidth]);

  // Render Item Component - unified for web and native
  const renderItem = useCallback(({ item, index }: { item: Credential; index: number }) => {
    const handlePress = () => onCardNavigate(item.id);
    const isActive = index === activeIndex;

    return (
      <CarouselItemUnified
        item={item}
        index={index}
        activeIndex={activeIndex}
        isActive={isActive}
        onPress={handlePress}
        containerWidth={containerWidth}
        cardWidth={cardWidth}
      />
    );
  }, [activeIndex, cardWidth, containerWidth, onCardNavigate]);

  return (
    <View style={styles.container} testID="home-root">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={styles.avatar} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Alex Johnson</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/profile')} style={styles.iconButton}>
             <FontAwesome5 name="cog" size={20} color={colors.text.primary} />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/history')} style={styles.iconButton}>
             <FontAwesome5 name="bell" size={20} color={colors.text.primary} />
             <View style={styles.badge} />
          </Pressable>
        </View>
      </View>

      <View style={styles.mainContent} testID="home-content">
        <View style={styles.actionBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.warningIcon}>
              <FontAwesome5 name="exclamation-triangle" size={16} color={colors.warning} />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Action Required</Text>
              <Text style={styles.bannerSubtitle}>1 ticket expiring soon.</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/history')} style={styles.reviewButton}>
            <Text style={styles.reviewButtonText}>Review</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>My Tickets</Text>
           <Text style={styles.viewAllText}>VIEW ALL</Text>
        </View>

        <View style={styles.carouselContainer} onLayout={onCarouselLayout}>
          {loading ? (
             <ActivityIndicator size="large" color={colors.brand.blue} />
          ) : (
            <View style={{ alignItems: 'center', gap: -20 }}>
              {items.slice(0, 5).map((item, index) => {
                const isActive = index === 2; // Middle card is active
                return (
                  <CarouselItemUnified
                    key={`${item.id}-${index}`}
                    item={item}
                    index={index}
                    activeIndex={2}
                    isActive={isActive}
                    onPress={() => onCardNavigate(item.id)}
                    containerWidth={containerWidth}
                    cardWidth={cardWidth}
                  />
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={[styles.bottomPills, { bottom: spacing.md }]}>
         <Pressable onPress={onAddTicket}>
           <LinearGradient
             colors={['#2BC9F4', '#0E89BA']}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={styles.addTicketButton}
           >
             <FontAwesome5 name="plus" size={16} color={colors.text.inverse} />
             <Text style={styles.addTicketText}>Add Ticket</Text>
           </LinearGradient>
         </Pressable>
         <Pressable style={styles.searchButton} onPress={onFindTraining}>
           <SearchTrainingLogo size={36} />
           <Text style={styles.searchTitle}>Search Training</Text>
         </Pressable>
      </View>
    </View>
  );
}

// Collapsed card view (title + status only) - like mockup
const CollapsedCard = ({ credential, onPress }: { credential: Credential; onPress: () => void }) => {
  const themeKey = credential.colorTheme || inferColorTheme(credential as Credential) || 'cyan';
  const theme = cardThemes[themeKey] || cardThemes.cyan;
  const status = inferStatus(credential);
  const statusConfig = statusColors[status] || statusColors.unverified;

  const category = credential.category || 'Credential';
  const title = credential.title || 'Unknown';
  const statusLabel = status === 'verified' || status === 'validated' ? 'Verified' :
                      status === 'expired' ? 'Expired' :
                      status === 'processing' ? 'Processing' : 'Unverified';

  // Format date for display
  const dateStr = credential.expires_at
    ? new Date(credential.expires_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
    : credential.issued_at
    ? new Date(credential.issued_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
    : '';

  return (
    <Pressable onPress={onPress} style={styles.collapsedCard}>
      <LinearGradient
        colors={[theme.from, theme.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.collapsedCardGradient}
      >
        <View style={styles.collapsedCardContent}>
          <View style={styles.collapsedCardLeft}>
            <Text style={styles.collapsedCategory}>{category.toUpperCase()}</Text>
            <Text style={styles.collapsedTitle} numberOfLines={1}>{title}</Text>
          </View>
          <View style={styles.collapsedCardRight}>
            <Text style={styles.collapsedStatusLabel}>{statusLabel.toUpperCase()}</Text>
            <Text style={styles.collapsedDate}>{dateStr}</Text>
          </View>
          <View style={[styles.collapsedStatusIcon, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
            <FontAwesome
              name={status === 'verified' || status === 'validated' ? 'check' :
                    status === 'expired' ? 'times' :
                    status === 'processing' ? 'clock-o' : 'exclamation'}
              size={14}
              color={statusConfig.text}
            />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const CarouselItemUnified = ({ item, index, activeIndex, isActive, onPress, containerWidth, cardWidth }: {
  item: Credential;
  index: number;
  activeIndex: number;
  isActive: boolean;
  onPress: () => void;
  containerWidth: number;
  cardWidth: number;
}) => {
  // Calculate distance from center for scaling/opacity
  const distance = Math.abs(index - activeIndex);

  // Scale: 1.0 for active, 0.92 for adjacent, 0.85 for far
  const scale = distance === 0 ? 1.0 : distance === 1 ? 0.92 : 0.85;

  // Opacity: 1.0 for active, 0.7 for adjacent, 0.4 for far
  const opacity = distance === 0 ? 1.0 : distance === 1 ? 0.7 : 0.4;

  // Z-index: higher for center
  const zIndex = distance === 0 ? 30 : distance === 1 ? 20 : 10;

  // Use actual card height for container (no extra spacing)
  const containerHeight = isActive ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;

  return (
    <View
      style={[
        styles.itemContainer,
        {
          width: containerWidth,
          height: containerHeight,
          zIndex,
          overflow: 'visible',
        }
      ]}
    >
      <View
        style={[
          styles.cardShadowWrapper,
          {
            width: cardWidth,
            height: containerHeight,
            transform: [{ scale }],
            opacity,
          }
        ]}
      >
        {isActive ? (
          <CredentialCard credential={item} onPress={onPress} />
        ) : (
          <CollapsedCard credential={item} onPress={onPress} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadows.soft,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.bg.surface,
  },
  
  mainContent: {
    flex: 1,
    paddingTop: spacing.md,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSizes.xl, fontWeight: '900', color: colors.text.primary },
  viewAllText: { fontSize: fontSizes.xs, fontWeight: '800', color: colors.brand.blue },

  // Carousel
  carouselContainer: {
    height: CONTAINER_HEIGHT,
    alignItems: 'center',
    overflow: 'visible',
  },
  cellContainer: {
    overflow: 'visible',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  cardShadowWrapper: {
    borderRadius: radii.xl,
    ...shadows.card,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden', // Clip card content to border radius
  },

  // Collapsed card styles
  collapsedCard: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  collapsedCardGradient: {
    flex: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
  },
  collapsedTitle: {
    fontSize: fontSizes.md,
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
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  collapsedDate: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text.inverse,
    fontFamily: 'SpaceMono',
  },
  collapsedStatusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Bottom Pills
  bottomPills: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addTicketButton: {
    height: PILLS_HEIGHT,
    borderRadius: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  searchTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.text.primary },
});
