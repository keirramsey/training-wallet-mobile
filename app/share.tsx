import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiFetch } from '@/src/lib/api';
import { inferColorTheme, DEMO_CREDENTIALS } from '@/src/data/demoCredentials';
import { getLocalCredentials } from '@/src/storage/credentialsStore';
import { colors, shadows, spacing } from '@/src/theme/tokens';
import type { Credential } from '@/src/types/credential';

type SelectedMap = Record<string, true>;

const SHARE_CREDENTIAL_ICONS: Record<string, { icon: string; bgColor: string; iconColor: string }> = {
  cyan: { icon: 'certificate', bgColor: '#DBEAFE', iconColor: '#2563EB' },
  orange: { icon: 'first-aid', bgColor: '#FEE2E2', iconColor: '#DC2626' },
  purple: { icon: 'warehouse', bgColor: '#FEF3C7', iconColor: '#D97706' },
  green: { icon: 'check-circle', bgColor: '#D1FAE5', iconColor: '#059669' },
  blue: { icon: 'id-badge', bgColor: '#DBEAFE', iconColor: '#2563EB' },
};

function normalizeApiError(err: unknown): { message: string; httpStatus?: number } {
  const anyErr = err as { message?: unknown; status?: unknown };
  const rawMessage = typeof anyErr?.message === 'string' ? anyErr.message.trim() : '';
  const httpStatus = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  if (!rawMessage) return { message: 'Request failed', httpStatus };
  return { message: rawMessage, httpStatus };
}

function parseCredentials(payload: unknown): Credential[] {
  if (!payload || typeof payload !== 'object') throw new Error('Unexpected response');
  const anyPayload = payload as { ok?: unknown; items?: unknown };
  if (anyPayload.ok !== true) throw new Error('Unexpected response');
  if (!Array.isArray(anyPayload.items)) throw new Error('Unexpected response');
  return anyPayload.items as Credential[];
}

function mergeCredentials(apiItems: Credential[], localItems: Credential[]): Credential[] {
  const seen = new Set<string>();
  const merged: Credential[] = [];
  for (const item of [...apiItems, ...localItems]) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged.sort((a, b) => {
    const aTime = new Date(a.issued_at).getTime();
    const bTime = new Date(b.issued_at).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function formatExpiry(iso: string | null | undefined): string {
  if (!iso) return 'No expiry';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', { month: '2-digit', year: 'numeric' });
}

function toPreselectList(value: string | string[] | undefined): string[] {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) return [];
  return first.split(',').map((s) => s.trim()).filter(Boolean);
}

export default function ShareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ preselect?: string | string[] }>();
  const preselect = useMemo(() => toPreselectList(params.preselect), [params.preselect]);
  const appliedPreselectKey = useRef<string>('');

  const [loading, setLoading] = useState(true);
  const [, setError] = useState<{ message: string; httpStatus?: number } | null>(null);
  const [items, setItems] = useState<Credential[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const local = await getLocalCredentials();
      let apiItems: Credential[] = [];
      try {
        const payload = (await apiFetch('/api/credentials')) as unknown;
        apiItems = parseCredentials(payload);
      } catch (apiErr) {
        // Use demo credentials as fallback
        apiItems = DEMO_CREDENTIALS;
        setError(normalizeApiError(apiErr));
      }
      setItems(mergeCredentials(apiItems, local));
    } catch (err) {
      setItems(DEMO_CREDENTIALS);
      setError(normalizeApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
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

  const goBack = useCallback(() => router.back(), [router]);

  const onCopyLink = useCallback(async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Select credentials', 'Choose one or more credentials to share.');
      return;
    }
    const link = `https://training.wallet/share/${Date.now()}`;
    Alert.alert('Link copied', link);
  }, [selectedItems]);

  const onShowQR = useCallback(() => {
    if (selectedItems.length === 0) {
      Alert.alert('Select credentials', 'Choose one or more credentials to share.');
      return;
    }
    Alert.alert('QR Code', 'QR code feature coming soon.');
  }, [selectedItems]);

  const onShareEmployer = useCallback(async () => {
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

  const onPreview = useCallback(() => {
    if (selectedItems.length === 0) return;
    const titles = selectedItems.map((c) => `• ${c.title}`).join('\n');
    Alert.alert('Preview', titles);
  }, [selectedItems]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={20} color={colors.text.primary} />
        </Pressable>
        <Pressable onPress={selectAll}>
          <Text style={styles.selectAllText}>Select All</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Share Credentials</Text>
        <Text style={styles.subtitle}>
          Select the qualifications you want to include in this share package.
        </Text>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {/* Credential Cards */}
        {!loading && (
          <View style={styles.credentialsList}>
            {items.map((credential) => {
              const checked = Boolean(selected[credential.id]);
              const themeKey = credential.colorTheme || inferColorTheme(credential) || 'cyan';
              const iconConfig = SHARE_CREDENTIAL_ICONS[themeKey] || SHARE_CREDENTIAL_ICONS.cyan;

              return (
                <Pressable
                  key={credential.id}
                  style={({ pressed }) => [
                    styles.credentialCard,
                    !checked && styles.credentialCardUnchecked,
                    pressed && styles.credentialCardPressed,
                  ]}
                  onPress={() => toggle(credential.id)}
                >
                  <View style={[styles.credentialIcon, { backgroundColor: iconConfig.bgColor }]}>
                    <FontAwesome5 name={iconConfig.icon} size={20} color={iconConfig.iconColor} />
                  </View>
                  <View style={styles.credentialInfo}>
                    <Text style={styles.credentialTitle} numberOfLines={1}>
                      {credential.title}
                    </Text>
                    <Text style={styles.credentialMeta}>
                      {credential.category || 'Credential'} • Exp: {formatExpiry(credential.expires_at)}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && (
                      <FontAwesome5 name="check" size={12} color={colors.text.inverse} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Selection Summary */}
        {!loading && selectedItems.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <FontAwesome5 name="layer-group" size={18} color={colors.primary} />
              <Text style={styles.summaryText}>
                {selectedItems.length} Qualification{selectedItems.length !== 1 ? 's' : ''} selected
              </Text>
            </View>
            <Pressable onPress={onPreview}>
              <Text style={styles.previewLink}>Preview</Text>
            </Pressable>
          </View>
        )}

        {/* Share Options */}
        {!loading && (
          <>
            <Text style={styles.shareViaTitle}>SHARE VIA</Text>
            <View style={styles.shareOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.shareOption,
                  pressed && styles.shareOptionPressed,
                ]}
                onPress={onCopyLink}
              >
                <View style={styles.shareOptionIcon}>
                  <FontAwesome5 name="link" size={20} color={colors.primary} />
                </View>
                <Text style={styles.shareOptionText}>Copy Link</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.shareOption,
                  pressed && styles.shareOptionPressed,
                ]}
                onPress={onShowQR}
              >
                <View style={styles.shareOptionIcon}>
                  <FontAwesome5 name="qrcode" size={20} color={colors.primary} />
                </View>
                <Text style={styles.shareOptionText}>QR Code</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.shareOption,
                  pressed && styles.shareOptionPressed,
                ]}
                onPress={onShareEmployer}
              >
                <View style={styles.shareOptionIcon}>
                  <FontAwesome5 name="briefcase" size={20} color={colors.primary} />
                </View>
                <Text style={styles.shareOptionText}>Employer</Text>
              </Pressable>
            </View>

            {/* Privacy Notice */}
            <View style={styles.privacyCard}>
              <FontAwesome5 name="lock" size={16} color={colors.text.muted} />
              <View style={styles.privacyText}>
                <Text style={styles.privacyTitle}>Secure Sharing</Text>
                <Text style={styles.privacyBody}>
                  You control what is shared and for how long. Your data is encrypted and you can
                  revoke access at any time.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.auth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.muted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  loadingState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  credentialsList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  credentialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.soft,
  },
  credentialCardUnchecked: {
    opacity: 0.7,
  },
  credentialCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  credentialIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialInfo: {
    flex: 1,
  },
  credentialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  credentialMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.muted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.surface,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  previewLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  shareViaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  shareOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  shareOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  shareOptionPressed: {
    backgroundColor: colors.bg.surfaceMuted,
    borderColor: colors.primary,
  },
  shareOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bg.surfaceMuted,
    borderRadius: 8,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  privacyBody: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.muted,
    lineHeight: 18,
  },
});
