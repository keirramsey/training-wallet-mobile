import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CredentialCard } from '@/components/CredentialCard';
import { apiFetch } from '@/src/lib/api';
import { inferStatus } from '@/src/data/demoCredentials';
import { getLocalCredential } from '@/src/storage/credentialsStore';
import { colors, fontSizes, layout, radii, shadows, spacing, statusColors } from '@/src/theme/tokens';
import type { Credential } from '@/src/types/credential';

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

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function getStatusDisplay(status: string | undefined) {
  const normalizedStatus = status || 'unverified';
  const config = statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.unverified;

  const labels: Record<string, string> = {
    verified: 'Verified',
    validated: 'Verified',
    expired: 'Expired',
    processing: 'Processing',
    unverified: 'Unverified',
  };

  const icons: Record<string, 'check-circle' | 'times-circle' | 'clock' | 'exclamation-circle'> = {
    verified: 'check-circle',
    validated: 'check-circle',
    expired: 'times-circle',
    processing: 'clock',
    unverified: 'exclamation-circle',
  };

  return {
    ...config,
    label: labels[normalizedStatus] || 'Unknown',
    iconName: icons[normalizedStatus] || 'question-circle',
  };
}

function parseCredentialDetailResponse(payload: unknown): Credential {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Unexpected /api/credentials/:id response: expected an object');
  }
  const anyPayload = payload as { ok?: unknown; item?: unknown };
  if (anyPayload.ok !== true) {
    throw new Error('Unexpected /api/credentials/:id response: expected { ok: true, item: Credential }');
  }
  if (!anyPayload.item || typeof anyPayload.item !== 'object') {
    throw new Error('Unexpected /api/credentials/:id response: expected item object');
  }

  const anyItem = anyPayload.item as { id?: unknown; title?: unknown; issuer_name?: unknown; issued_at?: unknown };
  if (typeof anyItem.id !== 'string') throw new Error('Unexpected credential: missing id');
  if (typeof anyItem.title !== 'string') throw new Error('Unexpected credential: missing title');
  if (typeof anyItem.issuer_name !== 'string') throw new Error('Unexpected credential: missing issuer_name');
  if (typeof anyItem.issued_at !== 'string') throw new Error('Unexpected credential: missing issued_at');

  return anyPayload.item as Credential;
}

export default function CredentialDetailScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id) ?? '', [params.id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; httpStatus?: number } | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (id.startsWith('local_')) {
        const local = await getLocalCredential(id);
        if (!local) {
          setCredential(null);
          setError({ message: 'Not found', httpStatus: 404 });
          return;
        }
        setCredential(local);
        return;
      }

      const payload = (await apiFetch(`/api/credentials/${id}`)) as unknown;
      setCredential(parseCredentialDetailResponse(payload));
    } catch (err) {
      setCredential(null);
      setError(normalizeApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError({ message: 'Missing credential id' });
      return;
    }
    void load();
  }, [id, load]);

  const onVerify = useCallback(async () => {
    if (!credential) return;
    if (credential.id.startsWith('local_')) {
      Alert.alert('Not verified yet', 'This credential is not issuer-verified yet.');
      return;
    }
    await Linking.openURL(`https://searchtraining.com.au/verify?id=${encodeURIComponent(credential.id)}`);
  }, [credential]);

  const onShare = useCallback(() => {
    if (!credential) return;
    router.push({ pathname: '/share', params: { preselect: credential.id } });
  }, [credential, router]);

  const onDownload = useCallback(() => {
    Alert.alert('Coming soon', 'Download Statement of Attainment will be available in a future update.');
  }, []);

  const onMenu = useCallback(() => {
    Alert.alert('Coming soon', 'More actions will be available in a future update.');
  }, []);

  const onAddToWallet = useCallback(() => {
    Alert.alert('Coming soon', 'Wallet integrations will be available in a future update.');
  }, []);

  const onManageLink = useCallback(async (path: string) => {
    await Linking.openURL(path);
  }, []);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView testID="credential-detail-root" style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading credential…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !credential) {
    const message =
      error?.httpStatus === 404 ? 'Not found' : error?.message ?? 'Request failed';
    return (
      <SafeAreaView testID="credential-detail-root" style={styles.safe}>
        <ScrollView
          testID="credential-detail-content"
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
        >
          <View style={styles.topNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
              style={({ pressed }) => [styles.navIcon, pressed ? styles.navIconPressed : null]}
            >
              <FontAwesome name="chevron-left" size={16} color={colors.text.primary} />
            </Pressable>
            <Text style={styles.navTitle}>Ticket Details</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More"
              onPress={onMenu}
              style={({ pressed }) => [styles.navIcon, pressed ? styles.navIconPressed : null]}
            >
              <FontAwesome name="ellipsis-v" size={16} color={colors.text.primary} />
            </Pressable>
          </View>

          <View style={[styles.panel, styles.errorPanel]}>
            <Text style={styles.panelTitle}>Couldn’t load ticket</Text>
            <Text style={styles.panelBody}>{message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={load}
              style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.primaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const units = Array.isArray(credential.units) ? credential.units : [];
  const evidence = Array.isArray(credential.evidence) ? credential.evidence : [];
  const effectiveStatus = inferStatus(credential);
  const statusDisplay = getStatusDisplay(effectiveStatus);
  const issuedAt = formatDate(credential.issued_at);
  const expiresAt = credential.expires_at ? formatDate(credential.expires_at) : 'Never';

  return (
    <SafeAreaView testID="credential-detail-root" style={styles.safe}>
      <ScrollView
        testID="credential-detail-content"
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={styles.topNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={goBack}
            style={({ pressed }) => [styles.navIcon, pressed ? styles.navIconPressed : null]}
          >
            <FontAwesome name="chevron-left" size={16} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.navTitle}>Ticket Details</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More"
            onPress={onMenu}
            style={({ pressed }) => [styles.navIcon, pressed ? styles.navIconPressed : null]}
          >
            <FontAwesome name="ellipsis-v" size={16} color={colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.cardWrap}>
          <CredentialCard credential={credential} />
        </View>

        {/* Issuer Info Section */}
        <View style={styles.issuerSection}>
          <View style={styles.issuerLeft}>
            <View style={styles.issuerLogoContainer}>
              {credential.issuer_logo_url ? (
                <Image
                  source={{ uri: credential.issuer_logo_url }}
                  style={styles.issuerLogo}
                  resizeMode="contain"
                />
              ) : (
                <FontAwesome5 name="building" size={20} color={colors.brand.blue} />
              )}
            </View>
            <View style={styles.issuerDetails}>
              <Text style={styles.issuerName}>{credential.issuer_name}</Text>
              {credential.rto_code && (
                <Text style={styles.rtoCode}>RTO: {credential.rto_code}</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusDisplay.bg, borderColor: statusDisplay.border }]}>
            <FontAwesome5 name={statusDisplay.iconName} size={12} color={statusDisplay.text} solid />
            <Text style={[styles.statusBadgeText, { color: statusDisplay.text }]}>{statusDisplay.label}</Text>
          </View>
        </View>

        {/* Dates Grid */}
        <View style={styles.datesPanel}>
          <View style={styles.dateItem}>
            <View style={styles.dateIconContainer}>
              <FontAwesome5 name="calendar-check" size={16} color={colors.brand.blue} />
            </View>
            <View>
              <Text style={styles.dateLabel}>Issue Date</Text>
              <Text style={styles.dateValue}>{issuedAt}</Text>
            </View>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateItem}>
            <View style={styles.dateIconContainer}>
              <FontAwesome5 name="calendar-times" size={16} color={effectiveStatus === 'expired' ? colors.danger : colors.brand.blue} />
            </View>
            <View>
              <Text style={styles.dateLabel}>Expires</Text>
              <Text style={[styles.dateValue, effectiveStatus === 'expired' && styles.dateValueExpired]}>{expiresAt}</Text>
            </View>
          </View>
        </View>

        {/* Licence ID */}
        {credential.licence_id && (
          <View style={styles.licencePanel}>
            <Text style={styles.licenceLabel}>Licence / Certificate ID</Text>
            <View style={styles.licenceRow}>
              <Text style={styles.licenceValue}>{credential.licence_id}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copy licence ID"
                onPress={() => Alert.alert('Copied', 'Licence ID copied to clipboard')}
                style={({ pressed }) => [styles.copyButton, pressed && styles.buttonPressed]}
              >
                <FontAwesome5 name="copy" size={14} color={colors.brand.blue} />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Units of competency</Text>
          {units.length === 0 ? (
            <Text style={styles.panelBody}>No units listed yet.</Text>
          ) : (
            <View style={styles.unitList}>
              {units.map((unit, index) => (
                <View key={`${unit.code}-${index}`} style={styles.unitRow}>
                  <View style={styles.unitDot} />
                  <View style={styles.unitText}>
                    <Text style={styles.unitCode}>{unit.code}</Text>
                    <Text style={styles.unitTitle} numberOfLines={2}>
                      {unit.title || 'Unit'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.qrPanel}>
          <View style={styles.qrLeft}>
            <Text style={styles.qrTitle}>Validate this ticket</Text>
            <Text style={styles.qrBody}>
              Scan the QR code or tap Verify to check this credential on Search Training.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onVerify}
              style={({ pressed }) => [styles.qrButton, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.qrButtonText}>Verify</Text>
            </Pressable>
          </View>
          <View style={styles.qrSquare}>
            <FontAwesome name="qrcode" size={28} color={colors.brand.blueDeep} />
          </View>
        </View>

        {evidence.length > 0 && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Evidence</Text>
            <Text style={styles.panelBody}>Attached certificate images stored on this device.</Text>
            <View style={styles.evidenceRow}>
              {evidence.slice(0, 3).map((e, index) => (
                <Image key={`${e.uri}-${index}`} source={{ uri: e.uri }} style={styles.evidenceThumb} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onDownload}
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}
          >
            <View style={styles.actionRow}>
              <FontAwesome name="download" size={18} color={colors.text.inverse} />
              <Text style={styles.primaryButtonText}>Download Statement of Attainment</Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onShare}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}
          >
            <View style={styles.actionRow}>
              <FontAwesome name="share-alt" size={18} color={colors.text.primary} />
              <Text style={styles.secondaryButtonText}>Share training</Text>
            </View>
          </Pressable>

          <View style={styles.walletRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onAddToWallet}
              style={({ pressed }) => [styles.walletButton, pressed ? styles.buttonPressed : null]}
            >
              <FontAwesome name="apple" size={16} color={colors.text.inverse} />
              <Text style={styles.walletButtonText}>Apple Wallet</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onAddToWallet}
              style={({ pressed }) => [styles.walletButton, styles.walletButtonLight, pressed ? styles.buttonPressed : null]}
            >
              <FontAwesome name="google" size={16} color={colors.text.primary} />
              <Text style={[styles.walletButtonText, styles.walletButtonTextLight]}>Google Pay</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.manageTitle}>Manage credential</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onManageLink('https://searchtraining.com.au')}
            style={({ pressed }) => [styles.manageRow, pressed ? styles.manageRowPressed : null]}
          >
            <View style={styles.manageLeft}>
              <View style={styles.manageIcon}>
                <FontAwesome name="search" size={14} color={colors.brand.blueDeep} />
              </View>
              <Text style={styles.manageText}>Search for more training</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.text.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onManageLink('https://searchtraining.com.au')}
            style={({ pressed }) => [styles.manageRow, pressed ? styles.manageRowPressed : null]}
          >
            <View style={styles.manageLeft}>
              <View style={styles.manageIcon}>
                <FontAwesome name="refresh" size={14} color={colors.brand.blueDeep} />
              </View>
              <Text style={styles.manageText}>Renew training</Text>
            </View>
            <FontAwesome name="angle-right" size={18} color={colors.text.muted} />
          </Pressable>
        </View>

        <Text style={styles.footerNote}>Last updated from National Registry (demo)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    gap: spacing.md,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navTitle: {
    color: colors.text.primary,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  navIcon: {
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
  navIconPressed: {
    opacity: 0.9,
  },
  cardWrap: {
    width: '100%',
    maxWidth: layout.cardMaxWidth,
    alignSelf: 'center',
  },
  // Issuer Section
  issuerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  issuerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  issuerLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bg.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  issuerLogo: {
    width: 32,
    height: 32,
  },
  issuerDetails: {
    flex: 1,
    gap: 2,
  },
  issuerName: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text.primary,
  },
  rtoCode: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text.muted,
    fontFamily: 'SpaceMono',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  // Dates Panel
  datesPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(43, 201, 244, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text.primary,
  },
  dateValueExpired: {
    color: colors.danger,
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  // Licence Panel
  licencePanel: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  licenceLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  licenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  licenceValue: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.text.primary,
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(43, 201, 244, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
  panel: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.soft,
  },
  errorPanel: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  panelTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '900',
    color: colors.text.primary,
  },
  panelBody: {
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
  },
  unitList: {
    gap: spacing.sm,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  unitDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: 'rgba(14,137,186,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(14,137,186,0.45)',
  },
  unitText: {
    flex: 1,
    gap: 2,
  },
  unitCode: {
    color: colors.text.primary,
    fontFamily: 'SpaceMono',
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  unitTitle: {
    color: colors.text.secondary,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  qrPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  qrLeft: {
    flex: 1,
    gap: 6,
  },
  qrTitle: {
    color: colors.text.primary,
    fontWeight: '900',
    fontSize: fontSizes.md,
  },
  qrBody: {
    color: colors.text.secondary,
    fontWeight: '600',
    lineHeight: 20,
  },
  qrSquare: {
    width: 74,
    height: 74,
    borderRadius: radii.xl,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: colors.brand.blue,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  qrButtonText: {
    color: colors.text.inverse,
    fontWeight: '900',
  },
  evidenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  evidenceThumb: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  actions: {
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  primaryButton: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: colors.brand.blue,
  },
  primaryButtonText: {
    color: colors.text.inverse,
    fontWeight: '900',
  },
  secondaryButton: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontWeight: '900',
  },
  walletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  walletButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#0B1220',
  },
  walletButtonLight: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletButtonText: {
    color: colors.text.inverse,
    fontWeight: '900',
  },
  walletButtonTextLight: {
    color: colors.text.primary,
  },
  manageTitle: {
    color: colors.text.muted,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: fontSizes.xs,
    marginBottom: 4,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.bg.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manageRowPressed: {
    opacity: 0.9,
  },
  manageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  manageIcon: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageText: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: fontSizes.sm,
  },
  footerNote: {
    color: colors.text.muted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
