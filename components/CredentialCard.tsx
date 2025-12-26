import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';
import type { Credential } from '@/src/types/credential';

type Props = {
  credential: Partial<Credential> & { id: string };
  onPress?: () => void;
};

function inferCategory(title: string, units: Credential['units']): string {
  const t = title.toLowerCase();
  if (t.includes('first aid') || t.includes('hltaid')) return 'First Aid Ticket';
  if (t.includes('chainsaw') || t.includes('arbor')) return 'Chainsaw Ticket';
  if (t.includes('white card') || t.includes('construction')) return 'Construction Ticket';
  if (t.includes('forklift')) return 'Heavy Machinery';
  const firstUnit = Array.isArray(units) && units.length > 0 ? units[0]?.code : '';
  if (firstUnit && typeof firstUnit === 'string') return 'Safety Cert';
  return 'Credential';
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function getStatusLabel(status: Credential['status']): { label: string; tone: 'good' | 'warn' } {
  if (status === 'verified') return { label: 'Verified', tone: 'good' };
  return { label: 'Unverified', tone: 'warn' };
}

export function CredentialCard({ credential, onPress }: Props) {
  const [logoError, setLogoError] = useState(false);

  const title = credential.title?.trim() || 'Credential';
  const issuer = credential.issuer_name?.trim() || 'Issuer';
  const category = useMemo(() => inferCategory(title, credential.units), [credential.units, title]);

  const issuedAt = formatDate(credential.issued_at);
  const expiresAt = credential.expires_at ? formatDate(credential.expires_at) : 'No expiry';

  const status = useMemo(() => getStatusLabel(credential.status), [credential.status]);
  const showLogo = Boolean(credential.issuer_logo_url) && !logoError;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      // @ts-expect-error `dataSet` is supported by react-native-web (used for deterministic E2E selectors).
      dataSet={{ ticketId: credential.id }}
      style={({ pressed }) => [styles.cardOuter, pressed && onPress ? styles.cardPressed : null]}
    >
      <LinearGradient
        colors={[colors.brand.cyan, colors.brand.blue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.logoSlot}>
              {showLogo ? (
                <Image
                  accessibilityLabel={`${issuer} logo`}
                  source={{ uri: credential.issuer_logo_url as string }}
                  style={styles.logo}
                  resizeMode="contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>{issuer.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View style={styles.topText}>
              <Text style={styles.category} numberOfLines={1}>
                {category}
              </Text>
              <Text style={styles.issuer} numberOfLines={1}>
                {issuer}
              </Text>
            </View>
          </View>

          <View style={[styles.statusChip, status.tone === 'good' ? styles.statusChipGood : styles.statusChipWarn]}>
            <FontAwesome
              name={status.tone === 'good' ? 'check-circle' : 'exclamation-circle'}
              size={13}
              color={colors.text.inverse}
            />
            <Text style={styles.statusChipText}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Issue date</Text>
            <Text style={styles.metaValue}>{issuedAt}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Expires</Text>
            <Text style={styles.metaValue}>{expiresAt}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.idLabel}>Licence ID</Text>
          <Text style={styles.idText} numberOfLines={1}>
            {credential.id}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="QR (coming soon)"
          onPress={(event) => {
            event.stopPropagation?.();
          }}
          style={({ pressed }) => [styles.qrButton, pressed ? styles.qrButtonPressed : null]}
        >
          <FontAwesome name="qrcode" size={18} color={colors.text.inverse} />
        </Pressable>

        <View pointerEvents="none" style={styles.shine} />
      </LinearGradient>
    </Pressable>
  );
}

export const CARD_HEIGHT = 236;

const styles = StyleSheet.create({
  cardOuter: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: radii.xl,
    ...shadows.card,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.98,
  },
  card: {
    flex: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  topText: {
    flex: 1,
    gap: 2,
  },
  logoSlot: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 34,
    height: 34,
  },
  logoFallback: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    color: colors.text.inverse,
    fontWeight: '900',
    fontSize: 16,
  },
  category: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    color: colors.text.inverse,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  issuer: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaCell: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    marginTop: 3,
    color: colors.text.inverse,
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },
  bottomRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  idLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  idText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '800',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  statusChipGood: {
    backgroundColor: 'rgba(16,185,129,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.36)',
  },
  statusChipWarn: {
    backgroundColor: 'rgba(245,158,11,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.36)',
  },
  statusChipText: {
    color: colors.text.inverse,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  qrButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  shine: {
    position: 'absolute',
    top: -90,
    right: -140,
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '18deg' }],
  },
});
