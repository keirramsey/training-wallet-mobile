import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  animation,
  card as cardTokens,
  cardThemes,
  colors,
  fontSizes,
  radii,
  shadows,
  spacing,
  statusColors,
} from '@/src/theme/tokens';
import type { Credential, CredentialStatus } from '@/src/types/credential';
import { inferColorTheme, inferStatus } from '@/src/data/demoCredentials';

type Props = {
  credential: Partial<Credential> & { id: string };
  // New API (expand/collapse behavior)
  isActive?: boolean;
  onActivate?: () => void;  // Called when clicking an inactive card
  onNavigate?: () => void;  // Called when clicking an already-active card
  // Legacy API (backwards compatibility)
  onPress?: () => void;
};

// Legacy export for backwards compatibility
export const CARD_HEIGHT = cardTokens.expanded.height;
export const CARD_HEIGHT_COLLAPSED = cardTokens.collapsed.height;
export const CARD_SPACING = cardTokens.spacing;

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function getStatusConfig(status: CredentialStatus | undefined) {
  const normalizedStatus = status || 'unverified';
  const config = statusColors[normalizedStatus] || statusColors.unverified;

  const labels: Record<string, string> = {
    verified: 'Verified',
    validated: 'Verified',
    expired: 'Expired',
    processing: 'Processing',
    unverified: 'Unverified',
  };

  const icons: Record<string, 'check-circle' | 'times-circle' | 'clock-o' | 'exclamation-circle'> = {
    verified: 'check-circle',
    validated: 'check-circle',
    expired: 'times-circle',
    processing: 'clock-o',
    unverified: 'exclamation-circle',
  };

  return {
    ...config,
    label: labels[normalizedStatus] || 'Unknown',
    iconName: icons[normalizedStatus] || 'question-circle',
  };
}

function inferCategory(credential: Partial<Credential>): string {
  if (credential.category) return credential.category;

  const title = (credential.title || '').toLowerCase();
  if (title.includes('first aid') || title.includes('cpr')) return 'Healthcare';
  if (title.includes('construction') || title.includes('safety')) return 'Safety Cert';
  if (title.includes('forklift') || title.includes('machinery')) return 'Heavy Machinery';
  if (title.includes('traffic')) return 'Traffic';
  if (title.includes('white card') || title.includes('induction')) return 'Induction';
  if (title.includes('height')) return 'Construction';

  return 'Credential';
}

export function CredentialCard({ credential, isActive = true, onActivate, onNavigate, onPress }: Props) {
  const [logoError, setLogoError] = useState(false);

  // Legacy mode: if onPress is provided but not onActivate/onNavigate, use legacy behavior
  const isLegacyMode = Boolean(onPress) && !onActivate && !onNavigate;

  // In legacy mode, always show as active (expanded)
  const effectiveActive = isLegacyMode ? true : isActive;

  // Animation values
  const heightAnim = useRef(new Animated.Value(effectiveActive ? cardTokens.expanded.height : cardTokens.collapsed.height)).current;
  const opacityAnim = useRef(new Animated.Value(effectiveActive ? 1 : cardTokens.inactiveOpacity)).current;
  const scaleAnim = useRef(new Animated.Value(effectiveActive ? 1 : cardTokens.inactiveScale)).current;
  const detailsOpacityAnim = useRef(new Animated.Value(effectiveActive ? 1 : 0)).current;
  const logoScaleAnim = useRef(new Animated.Value(effectiveActive ? 1 : 0)).current;

  // Animate on state change (skip in legacy mode)
  useEffect(() => {
    if (isLegacyMode) return; // No animations in legacy mode

    const targetHeight = effectiveActive ? cardTokens.expanded.height : cardTokens.collapsed.height;
    const targetOpacity = effectiveActive ? 1 : cardTokens.inactiveOpacity;
    const targetScale = effectiveActive ? 1 : cardTokens.inactiveScale;
    const targetDetailsOpacity = effectiveActive ? 1 : 0;
    const targetLogoScale = effectiveActive ? 1 : 0;

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: targetHeight,
        duration: animation.expandDuration,
        useNativeDriver: false, // height can't use native driver
      }),
      Animated.timing(opacityAnim, {
        toValue: targetOpacity,
        duration: animation.expandDuration,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: targetScale,
        duration: animation.expandDuration,
        useNativeDriver: true,
      }),
      Animated.timing(detailsOpacityAnim, {
        toValue: targetDetailsOpacity,
        duration: animation.expandDuration,
        delay: effectiveActive ? 75 : 0, // Delay showing details on expand
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: targetLogoScale,
        duration: animation.expandDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [effectiveActive, isLegacyMode, heightAnim, opacityAnim, scaleAnim, detailsOpacityAnim, logoScaleAnim]);

  // Credential data
  const title = credential.title?.trim() || 'Credential';
  const issuer = credential.issuer_name?.trim() || 'Issuer';
  const category = useMemo(() => inferCategory(credential), [credential]);
  const licenceId = credential.licence_id || credential.id;

  const issuedAt = formatDate(credential.issued_at);
  const expiresAt = credential.expires_at ? formatDate(credential.expires_at) : 'Never';

  // Status and theme
  const effectiveStatus = inferStatus(credential as Credential);
  const statusConfig = useMemo(() => getStatusConfig(effectiveStatus), [effectiveStatus]);

  const themeKey = credential.colorTheme || inferColorTheme(credential as Credential) || 'cyan';
  const theme = cardThemes[themeKey] || cardThemes.cyan;

  const showLogo = Boolean(credential.issuer_logo_url) && !logoError;

  const handlePress = () => {
    // Legacy mode: just call onPress
    if (isLegacyMode && onPress) {
      onPress();
      return;
    }

    // New mode: expand/collapse behavior
    if (effectiveActive) {
      onNavigate?.();
    } else {
      onActivate?.();
    }
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          height: heightAnim,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={handlePress}
        // @ts-expect-error `dataSet` is supported by react-native-web
        dataSet={{ ticketId: credential.id }}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed ? styles.cardPressed : null,
        ]}
      >
        <LinearGradient
          colors={[theme.from, theme.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Top shine effect (visible when active) */}
          {effectiveActive && (
            <>
              <View style={styles.shineTop} pointerEvents="none" />
              <View style={styles.shineBottom} pointerEvents="none" />
            </>
          )}

          {/* Header Content - Always Visible */}
          <Animated.View
            style={[
              styles.headerRow,
              { paddingTop: effectiveActive ? 16 : 0 },
            ]}
          >
            <View style={styles.headerLeft}>
              {/* Logo - Animated visibility */}
              <Animated.View
                style={[
                  styles.logoSlot,
                  {
                    opacity: logoScaleAnim,
                    transform: [{ scale: logoScaleAnim }],
                    width: effectiveActive ? 40 : 0,
                    marginRight: effectiveActive ? 12 : 0,
                  },
                ]}
              >
                {showLogo ? (
                  <Image
                    accessibilityLabel={`${issuer} logo`}
                    source={{ uri: credential.issuer_logo_url as string }}
                    style={styles.logo}
                    resizeMode="contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Text style={styles.logoFallbackText}>{issuer.slice(0, 1).toUpperCase()}</Text>
                )}
              </Animated.View>

              <View style={styles.headerText}>
                <Text
                  style={[
                    styles.category,
                    { opacity: effectiveActive ? 0.7 : 0.6 },
                  ]}
                  numberOfLines={1}
                >
                  {category}
                </Text>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            </View>

            {/* Status Chip */}
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: statusConfig.bg,
                  borderColor: statusConfig.border,
                },
                effectiveActive ? styles.statusChipActive : styles.statusChipCollapsed,
              ]}
            >
              <FontAwesome
                name={statusConfig.iconName}
                size={14}
                color={statusConfig.text}
              />
              <Text style={[styles.statusChipText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </Animated.View>

          {/* Expanded Content - Only visible when active */}
          <Animated.View
            style={[
              styles.expandedContent,
              {
                opacity: detailsOpacityAnim,
                transform: [{
                  translateY: detailsOpacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                }],
              },
            ]}
            pointerEvents={effectiveActive ? 'auto' : 'none'}
          >
            {/* Dates Grid */}
            <View style={styles.datesGrid}>
              <View style={styles.dateCell}>
                <Text style={styles.dateLabel}>Issue Date</Text>
                <Text style={styles.dateValue}>{issuedAt}</Text>
              </View>
              <View style={styles.dateCell}>
                <Text style={styles.dateLabel}>Licence ID</Text>
                <Text style={styles.licenceId}>{licenceId}</Text>
              </View>
            </View>

            {/* Bottom Row with Expiry and QR */}
            <View style={styles.bottomRow}>
              <View style={styles.expirySection}>
                <Text style={styles.expiryLabel}>Expires</Text>
                <View style={styles.expiryValue}>
                  <FontAwesome name="calendar" size={18} color={colors.text.inverse} />
                  <Text style={styles.expiryDate}>{expiresAt}</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View QR code"
                onPress={(event) => {
                  event.stopPropagation?.();
                  // TODO: Open QR modal
                }}
                style={({ pressed }) => [styles.qrButton, pressed ? styles.qrButtonPressed : null]}
              >
                <FontAwesome name="qrcode" size={28} color={colors.text.primary} />
              </Pressable>
            </View>
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: cardTokens.borderRadius,
    ...shadows.card,
    overflow: 'hidden',
  },
  cardPressable: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.98,
  },
  card: {
    flex: 1,
    borderRadius: cardTokens.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },

  // Shine effects (from mockup)
  shineTop: {
    position: 'absolute',
    top: -48,
    right: -48,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  shineBottom: {
    position: 'absolute',
    bottom: -32,
    left: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Header (always visible)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  logoSlot: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  logoFallbackText: {
    color: colors.text.primary,
    fontWeight: '900',
    fontSize: 16,
  },
  category: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text.inverse,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Status chip
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  statusChipActive: {
    // Positioned normally in header when active
  },
  statusChipCollapsed: {
    // Same position in collapsed state
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Expanded content
  expandedContent: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
    justifyContent: 'space-between',
  },

  // Dates grid
  datesGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  dateCell: {
    flex: 1,
  },
  dateLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateValue: {
    color: colors.text.inverse,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  licenceId: {
    color: colors.text.inverse,
    fontSize: fontSizes.sm,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  expirySection: {
    flex: 1,
  },
  expiryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  expiryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryDate: {
    color: colors.text.inverse,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },

  // QR button
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  qrButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
