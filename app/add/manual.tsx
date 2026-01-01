import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addLocalCredential } from '@/src/storage/credentialsStore';
import { colors, fontSizes, shadows, spacing } from '@/src/theme/tokens';
import type { CredentialEvidence, CredentialUnit } from '@/src/types/credential';

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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ evidence_uri?: string; evidence_meta?: string }>();
  const evidenceUri = typeof params.evidence_uri === 'string' ? params.evidence_uri : '';
  const evidenceMeta = typeof params.evidence_meta === 'string' ? params.evidence_meta : '';

  // Form state
  const [rtoName, setRtoName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [unitInput, setUnitInput] = useState('');
  const [units, setUnits] = useState<CredentialUnit[]>([]);
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [noExpiry, setNoExpiry] = useState(false);
  const [certificateUri, setCertificateUri] = useState(evidenceUri);
  const [saving, setSaving] = useState(false);

  const isValid = courseName.trim().length > 0 && issuedAt.trim().length > 0;

  const goBack = useCallback(() => router.back(), [router]);

  const onToggleNoExpiry = useCallback((next: boolean) => {
    setNoExpiry(next);
    if (next) setExpiresAt('');
  }, []);

  const onAddUnit = useCallback(() => {
    const code = unitInput.trim().toUpperCase();
    if (!code) return;
    if (units.some((u) => u.code === code)) return;
    setUnits((prev) => [...prev, { code }]);
    setUnitInput('');
  }, [unitInput, units]);

  const onRemoveUnit = useCallback((code: string) => {
    setUnits((prev) => prev.filter((u) => u.code !== code));
  }, []);

  const pickCertificate = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]) {
      setCertificateUri(result.assets[0].uri);
    }
  }, []);

  const onSave = useCallback(async () => {
    if (saving || !isValid) return;
    try {
      setSaving(true);
      const issuedIso = parseDateToIso(issuedAt);
      const expiresIso = noExpiry || !expiresAt.trim() ? null : parseDateToIso(expiresAt);

      let evidence: CredentialEvidence[] | undefined;
      if (certificateUri.trim()) {
        let meta: Record<string, unknown> | undefined;
        if (evidenceMeta.trim()) {
          try {
            meta = JSON.parse(evidenceMeta) as Record<string, unknown>;
          } catch {
            meta = { raw: evidenceMeta };
          }
        }
        evidence = [{ uri: certificateUri, kind: 'image', created_at: new Date().toISOString(), meta }];
      }

      const created = await addLocalCredential({
        title: courseName,
        issuer_name: rtoName || 'Unknown RTO',
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
  }, [certificateUri, courseName, evidenceMeta, expiresAt, isValid, issuedAt, noExpiry, rtoName, router, saving, units]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={goBack} style={styles.headerButton}>
          <FontAwesome5 name="times" size={20} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Training</Text>
        <Pressable
          onPress={onSave}
          disabled={!isValid || saving}
          style={styles.headerButton}
        >
          <Text style={[styles.saveText, (!isValid || saving) && styles.saveDisabled]}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Provider Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provider Details</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>RTO Name</Text>
            <View style={styles.searchInput}>
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search registered training organisations"
                placeholderTextColor={colors.input.placeholder}
                value={rtoName}
                onChangeText={setRtoName}
              />
              <FontAwesome5 name="search" size={16} color={colors.input.placeholder} />
            </View>
          </View>
          <View style={styles.rtoCard}>
            <View style={styles.rtoIcon}>
              <FontAwesome5 name="graduation-cap" size={20} color={colors.input.placeholder} />
            </View>
            <View style={styles.rtoText}>
              <Text style={styles.rtoTitle}>{rtoName || 'No RTO Selected'}</Text>
              <Text style={styles.rtoSubtitle}>
                {rtoName ? 'Registered Training Organisation' : 'Select an RTO to see logo'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Qualification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Qualification</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Course / Qualification Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Certificate III in Business"
              placeholderTextColor={colors.input.placeholder}
              value={courseName}
              onChangeText={setCourseName}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Units of Competency</Text>
            <View style={styles.unitsContainer}>
              <View style={styles.unitChips}>
                {units.map((unit) => (
                  <View key={unit.code} style={styles.unitChip}>
                    <Text style={styles.unitChipText}>{unit.code}</Text>
                    <Pressable onPress={() => onRemoveUnit(unit.code)}>
                      <FontAwesome5 name="times" size={12} color={colors.primary} />
                    </Pressable>
                  </View>
                ))}
              </View>
              <TextInput
                style={styles.unitInput}
                placeholder="Search units or enter code..."
                placeholderTextColor={colors.input.placeholder}
                value={unitInput}
                onChangeText={setUnitInput}
                onSubmitEditing={onAddUnit}
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.fieldHint}>Multiple selection allowed</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Issue Date</Text>
              <View style={styles.dateInput}>
                <TextInput
                  style={styles.dateTextInput}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor={colors.input.placeholder}
                  value={issuedAt}
                  onChangeText={setIssuedAt}
                />
                <FontAwesome5 name="calendar-alt" size={16} color={colors.input.placeholder} />
              </View>
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Expiry Date</Text>
              <View style={[styles.dateInput, noExpiry && styles.dateInputDisabled]}>
                <TextInput
                  style={styles.dateTextInput}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor={colors.input.placeholder}
                  value={expiresAt}
                  onChangeText={setExpiresAt}
                  editable={!noExpiry}
                />
                <FontAwesome5 name="calendar-alt" size={16} color={colors.input.placeholder} />
              </View>
            </View>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>This training does not expire</Text>
            <Switch
              value={noExpiry}
              onValueChange={onToggleNoExpiry}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Evidence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence</Text>
          <Pressable style={styles.uploadBox} onPress={pickCertificate}>
            {certificateUri ? (
              <Image source={{ uri: certificateUri }} style={styles.uploadPreview} />
            ) : (
              <>
                <View style={styles.uploadIconWrap}>
                  <FontAwesome5 name="cloud-upload-alt" size={24} color={colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Upload Certificate</Text>
                <Text style={styles.uploadSubtitle}>PDF or Photo (Max 5MB)</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <FontAwesome5 name="info-circle" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Self-attested:</Text> This record will be marked as
            'Unverified' until confirmed by the issuing RTO.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={[styles.addButton, (!isValid || saving) && styles.addButtonDisabled]}
          onPress={onSave}
          disabled={!isValid || saving}
        >
          <Text style={styles.addButtonText}>{saving ? 'Saving...' : 'Add Training'}</Text>
        </Pressable>
      </View>
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
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  saveText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary,
  },
  saveDisabled: {
    color: colors.text.muted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  divider: {
    height: 8,
    backgroundColor: colors.bg.surfaceMuted,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: colors.text.primary,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  rtoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  rtoIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.bg.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rtoText: {
    flex: 1,
  },
  rtoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  rtoSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  unitsContainer: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    padding: spacing.sm,
  },
  unitChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  unitInput: {
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  dateInputDisabled: {
    backgroundColor: colors.bg.surfaceMuted,
    opacity: 0.6,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surfaceMuted,
    minHeight: 150,
  },
  uploadIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
  },
  uploadPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
  },
  addButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});
