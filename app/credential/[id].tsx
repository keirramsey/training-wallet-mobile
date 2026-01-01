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
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiFetch } from '@/src/lib/api';
import { inferColorTheme, inferStatus, DEMO_CREDENTIALS } from '@/src/data/demoCredentials';
import { getLocalCredential } from '@/src/storage/credentialsStore';
import { cardThemes, colors, fontSizes, shadows, spacing } from '@/src/theme/tokens';
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
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
      if (id.startsWith('local_') || id.startsWith('demo_')) {
        let local = await getLocalCredential(id);
        if (!local) {
          local = DEMO_CREDENTIALS.find(c => c.id === id) || null;
        }
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

  const goBack = useCallback(() => router.back(), [router]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.brand.blue} />
      </View>
    );
  }

  if (error || !credential) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error?.message || 'Could not load ticket'}</Text>
          <Pressable onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const themeKey = credential.colorTheme || inferColorTheme(credential) || 'cyan';
  const theme = cardThemes[themeKey] || cardThemes.cyan;
  const _status = inferStatus(credential); // Available for future use
  const units = credential.units || [];

  return (
    <View
      style={styles.root}
      testID="credential-detail-root"
      // @ts-expect-error `dataSet` is supported by react-native-web
      dataSet={{ testid: 'credential-detail-root' }}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={goBack} style={styles.headerButton}>
          <FontAwesome5 name="arrow-left" size={18} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Ticket Details</Text>
        <Pressable style={styles.headerButton} onPress={() => Alert.alert('Options')}>
          <FontAwesome5 name="ellipsis-v" size={18} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        testID="credential-detail-content"
        // @ts-expect-error `dataSet` is supported by react-native-web
        dataSet={{ testid: 'credential-detail-content' }}
      >
        {/* Main Ticket Card */}
        <View style={styles.ticketCard}>
          <LinearGradient
            colors={[theme.from, theme.to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Top Row: Issuer & Status */}
            <View style={styles.cardHeader}>
              <View style={styles.issuerRow}>
                <View style={styles.issuerLogoWrap}>
                  {credential.issuer_logo_url ? (
                    <Image source={{ uri: credential.issuer_logo_url }} style={styles.issuerLogo} />
                  ) : (
                    <Text style={styles.issuerInitial}>{credential.issuer_name?.charAt(0)}</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.issuerName}>{credential.issuer_name}</Text>
                  {credential.rto_code && (
                    <View style={styles.rtoRow}>
                      <FontAwesome5 name="check-circle" size={10} color="#BFDBFE" solid />
                      <Text style={styles.rtoText}>{credential.rto_code}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.verifiedBadge}>
                <FontAwesome5 name="check-circle" size={12} color="#6EE7B7" solid />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.categoryLabel}>{credential.category || 'Credential'}</Text>
              <Text style={styles.credentialTitle}>{credential.title}</Text>
              <Text style={styles.credentialCode}>{credential.licence_id || credential.id}</Text>
            </View>

            {/* Dates Row */}
            <View style={styles.datesRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Issue Date</Text>
                <Text style={styles.dateValue}>{formatDate(credential.issued_at)}</Text>
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Expires</Text>
                <Text style={[styles.dateValue, { color: '#6EE7B7' }]}>
                  {formatDate(credential.expires_at)}
                </Text>
              </View>
            </View>

            {/* Units Section */}
            <View style={styles.unitsSection}>
              <Text style={styles.unitsHeader}>Units of Competency</Text>
              <View style={styles.unitsList}>
                {units.length > 0 ? units.map((u, i) => (
                  <View key={i} style={styles.unitRow}>
                    <FontAwesome5 name="check-circle" size={16} color="#6EE7B7" solid />
                    <View style={styles.unitInfo}>
                      <Text style={styles.unitCode}>{u.code}</Text>
                      <Text style={styles.unitTitle}>{u.title}</Text>
                    </View>
                  </View>
                )) : (
                  <Text style={styles.noUnits}>No units listed</Text>
                )}
              </View>
            </View>

            {/* Validation Footer */}
            <Pressable 
              style={styles.validationFooter}
              onPress={() => Linking.openURL('https://searchtraining.com.au/verify')}
            >
              <View>
                <View style={styles.validateRow}>
                  <Text style={styles.validateText}>Tap to validate authenticity</Text>
                  <FontAwesome5 name="external-link-alt" size={12} color="#BFDBFE" />
                </View>
                <Text style={styles.cryptoText}>This credential is cryptographically signed.</Text>
              </View>
              <View style={styles.qrIconWrap}>
                <FontAwesome name="qrcode" size={24} color="#0F172A" />
              </View>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.downloadButton}>
            <FontAwesome5 name="file-pdf" size={18} color="#FFF" />
            <Text style={styles.downloadText}>Download Statement</Text>
          </Pressable>
          
          <Pressable 
            style={styles.shareButton}
            onPress={() => router.push({ pathname: '/share', params: { preselect: credential.id } })}
          >
            <FontAwesome5 name="share-alt" size={18} color={colors.text.secondary} />
            <Text style={styles.shareText}>Share training</Text>
          </Pressable>
        </View>

        {/* Wallet Buttons */}
        <View style={styles.walletRow}>
          <Pressable style={styles.walletBtnDark}>
            <FontAwesome5 name="wallet" size={20} color="#FFF" />
            <View>
              <Text style={styles.walletLabel}>ADD TO</Text>
              <Text style={styles.walletValue}>Apple Wallet</Text>
            </View>
          </Pressable>
          <Pressable style={styles.walletBtnLight}>
            <FontAwesome5 name="google-wallet" size={20} color="#2563EB" />
            <View>
              <Text style={styles.walletLabel}>SAVE TO</Text>
              <Text style={[styles.walletValue, { color: colors.text.primary }]}>Google Pay</Text>
            </View>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg.app,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    backgroundColor: colors.brand.blue,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  
  // Ticket Card
  ticketCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  cardGradient: {
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  issuerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  issuerLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 2,
  },
  issuerLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  issuerInitial: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.brand.blue,
  },
  issuerName: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
  },
  rtoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rtoText: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  verifiedText: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  titleSection: {
    marginBottom: spacing.lg,
  },
  categoryLabel: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  credentialTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 4,
  },
  credentialCode: {
    color: '#EFF6FF',
    fontSize: 16,
    fontWeight: '500',
  },

  datesRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    color: '#BFDBFE',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dateDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: spacing.md,
  },

  unitsSection: {
    marginBottom: spacing.md,
  },
  unitsHeader: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  unitsList: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  unitInfo: {
    flex: 1,
    gap: 2,
  },
  unitCode: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '800',
  },
  unitTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  noUnits: {
    color: '#BFDBFE',
    padding: spacing.md,
    fontStyle: 'italic',
    fontSize: 13,
  },

  validationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed', // Note: dashed not fully supported on View border, often solid on native
  },
  validateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  validateText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cryptoText: {
    color: '#BFDBFE',
    fontSize: 11,
  },
  qrIconWrap: {
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 10,
    ...shadows.soft,
  },

  // Actions
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.brand.blue,
    paddingVertical: 16,
    borderRadius: 14,
    ...shadows.soft,
  },
  downloadText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },

  walletRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  walletBtnDark: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletBtnLight: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  walletValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
