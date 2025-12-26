import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';
import { addLocalCredential } from '@/src/storage/credentialsStore';
import type { CredentialEvidence, CredentialUnit } from '@/src/types/credential';

type Field = { label: string; placeholder: string };

function parseDateToIso(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Date is required');

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const iso = `${trimmed}T00:00:00.000Z`;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) throw new Error('Date must be valid (YYYY-MM-DD)');
    return date.toISOString();
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) throw new Error('Date must be valid (YYYY-MM-DD)');
  return date.toISOString();
}

export default function AddManualScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ evidence_uri?: string; evidence_meta?: string }>();
  const evidenceUri = typeof params.evidence_uri === 'string' ? params.evidence_uri : '';
  const evidenceMeta = typeof params.evidence_meta === 'string' ? params.evidence_meta : '';

  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [noExpiry, setNoExpiry] = useState(false);

  const [unitCode, setUnitCode] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [units, setUnits] = useState<CredentialUnit[]>([]);

  const [saving, setSaving] = useState(false);

  const fields = useMemo<Field[]>(
    () => [
      { label: 'Credential title', placeholder: 'e.g. HLTAID011 Provide First Aid' },
      { label: 'Issuer', placeholder: 'e.g. Search Training (Demo RTO)' },
      { label: 'Issued date', placeholder: 'YYYY-MM-DD' },
      { label: 'Expiry (optional)', placeholder: 'YYYY-MM-DD or leave blank' },
    ],
    []
  );

  const isValid = title.trim().length > 0 && issuer.trim().length > 0 && issuedAt.trim().length > 0;

  const onToggleNoExpiry = useCallback((next: boolean) => {
    setNoExpiry(next);
    if (next) setExpiresAt('');
  }, []);

  const onAddUnit = useCallback(() => {
    const code = unitCode.trim();
    const title = unitTitle.trim();
    if (!code) return;
    setUnits((prev) => [...prev, { code, title: title || undefined }]);
    setUnitCode('');
    setUnitTitle('');
  }, [unitCode, unitTitle]);

  const onRemoveUnit = useCallback((index: number) => {
    setUnits((prev) => prev.filter((_u, i) => i !== index));
  }, []);

  const onSave = useCallback(async () => {
    if (saving) return;
    if (!isValid) return;

    try {
      setSaving(true);
      const issuedIso = parseDateToIso(issuedAt);
      const expiresIso = noExpiry || !expiresAt.trim() ? null : parseDateToIso(expiresAt);

      let evidence: CredentialEvidence[] | undefined;
      if (evidenceUri.trim().length > 0) {
        let meta: Record<string, unknown> | undefined;
        if (evidenceMeta.trim().length > 0) {
          try {
            meta = JSON.parse(evidenceMeta) as Record<string, unknown>;
          } catch {
            meta = { raw: evidenceMeta };
          }
        }
        evidence = [
          {
            uri: evidenceUri,
            kind: 'image',
            created_at: new Date().toISOString(),
            meta,
          },
        ];
      }

      const created = await addLocalCredential({
        title,
        issuer_name: issuer,
        issued_at: issuedIso,
        expires_at: expiresIso,
        units,
        evidence,
      });

      router.push({ pathname: '/wallet', params: { toast: 'saved', id: created.id } });
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [evidenceMeta, evidenceUri, expiresAt, issuer, isValid, issuedAt, noExpiry, router, saving, title, units]);

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Manual entry</Text>
        <Text style={styles.heroSubtitle}>Saved locally on this device (unverified).</Text>
      </LinearGradient>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Details</Text>

        {evidenceUri.trim().length > 0 && (
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceTitle}>Evidence attached</Text>
            <Text style={styles.evidenceBody}>This credential will be saved with your uploaded certificate image.</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>{fields[0].label}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={fields[0].placeholder}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{fields[1].label}</Text>
          <TextInput
            value={issuer}
            onChangeText={setIssuer}
            placeholder={fields[1].placeholder}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>{fields[2].label}</Text>
            <TextInput
              value={issuedAt}
              onChangeText={setIssuedAt}
              placeholder={fields[2].placeholder}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>{fields[3].label}</Text>
            <TextInput
              value={expiresAt}
              onChangeText={setExpiresAt}
              placeholder={fields[3].placeholder}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="none"
              editable={!noExpiry}
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchTitle}>No expiry</Text>
            <Text style={styles.switchBody}>For tickets that don’t expire</Text>
          </View>
          <Switch value={noExpiry} onValueChange={onToggleNoExpiry} />
        </View>

        <View style={styles.panelDivider} />

        <Text style={styles.panelTitle}>Units (optional)</Text>

        <View style={styles.fieldRow}>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>Unit code</Text>
            <TextInput
              value={unitCode}
              onChangeText={setUnitCode}
              placeholder="e.g. HLTAID011"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>Unit title</Text>
            <TextInput
              value={unitTitle}
              onChangeText={setUnitTitle}
              placeholder="Optional"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onAddUnit}
          disabled={!unitCode.trim()}
          style={({ pressed }) => [
            styles.secondaryButton,
            !unitCode.trim() ? styles.buttonDisabled : null,
            pressed && unitCode.trim() ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Add unit</Text>
        </Pressable>

        {units.length > 0 && (
          <View style={styles.unitsList}>
            {units.map((unit, index) => (
              <View key={`${unit.code}-${index}`} style={styles.unitRow}>
                <View style={styles.unitPill}>
                  <Text style={styles.unitCode}>{unit.code}</Text>
                </View>
                <Text style={styles.unitName} numberOfLines={1}>
                  {unit.title || 'Unit'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onRemoveUnit(index)}
                  style={({ pressed }) => [styles.unitRemove, pressed ? styles.buttonPressed : null]}
                >
                  <Text style={styles.unitRemoveText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={!isValid || saving}
          onPress={onSave}
          style={({ pressed }) => [
            styles.button,
            !isValid || saving ? styles.buttonDisabled : null,
            pressed && isValid && !saving ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
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
  panel: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1220',
  },
  evidenceCard: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    gap: 4,
  },
  evidenceTitle: {
    fontWeight: '900',
    color: '#0B1220',
  },
  evidenceBody: {
    color: '#4B5563',
    fontWeight: '600',
    lineHeight: 18,
    fontSize: 12,
  },
  field: {
    gap: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldHalf: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontWeight: '900',
    color: '#0B1220',
  },
  switchBody: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  panelDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    color: '#0B1220',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0B1220',
    fontWeight: '900',
  },
  unitsList: {
    gap: 10,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unitPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  unitCode: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '900',
    color: '#0B1220',
  },
  unitName: {
    flex: 1,
    color: '#0B1220',
    fontWeight: '700',
  },
  unitRemove: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unitRemoveText: {
    color: '#6B7280',
    fontWeight: '800',
    fontSize: 12,
  },
  button: {
    marginTop: 6,
    backgroundColor: '#0E89BA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
