import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadows, spacing } from '@/src/theme/tokens';
import type { CredentialEvidence } from '@/src/types/credential';

export default function AddUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [verifying, setVerifying] = useState(false);

  const evidence = useMemo<CredentialEvidence | null>(() => {
    if (!asset?.uri) return null;
    const meta: Record<string, unknown> = {
      fileName: asset.fileName ?? null,
      fileSize: typeof asset.fileSize === 'number' ? asset.fileSize : null,
      width: typeof asset.width === 'number' ? asset.width : null,
      height: typeof asset.height === 'number' ? asset.height : null,
      mimeType: asset.mimeType ?? null,
    };
    return {
      uri: asset.uri,
      kind: 'image',
      created_at: new Date().toISOString(),
      meta,
    };
  }, [asset]);

  const goBack = useCallback(() => router.back(), [router]);

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to choose a certificate image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled) return;
    setAsset(result.assets?.[0] ?? null);
  }, []);

  const openCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to capture a certificate photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled) return;
    setAsset(result.assets?.[0] ?? null);
  }, []);

  const onUploadZonePress = useCallback(() => {
    // Show action sheet or pick from library
    pickFromLibrary();
  }, [pickFromLibrary]);

  const onManualEntry = useCallback(() => {
    if (evidence) {
      router.push({
        pathname: '/add/manual',
        params: {
          evidence_uri: evidence.uri,
          evidence_meta: JSON.stringify(evidence.meta ?? {}),
        },
      });
    } else {
      router.push('/add/manual');
    }
  }, [evidence, router]);

  const onVerifyTicket = useCallback(async () => {
    if (!evidence) return;
    if (verifying) return;

    try {
      setVerifying(true);
      // Simulate verification process - would send to RTO API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to manual entry with evidence attached
      router.push({
        pathname: '/add/manual',
        params: {
          evidence_uri: evidence.uri,
          evidence_meta: JSON.stringify(evidence.meta ?? {}),
        },
      });
    } catch (err) {
      Alert.alert('Verification failed', err instanceof Error ? err.message : String(err));
    } finally {
      setVerifying(false);
    }
  }, [evidence, router, verifying]);

  const hasImage = Boolean(asset);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={18} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add New Training</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Upload Certificate</Text>
          <Text style={styles.subtitle}>
            Upload a clear picture of your ticket or Statement of Attainment.
          </Text>
        </View>

        {/* Upload Zone */}
        <Pressable
          style={({ pressed }) => [
            styles.uploadZone,
            pressed && styles.uploadZonePressed,
            hasImage && styles.uploadZoneWithImage,
          ]}
          onPress={onUploadZonePress}
        >
          {hasImage && asset ? (
            <Image source={{ uri: asset.uri }} style={styles.uploadedImage} />
          ) : (
            <>
              <View style={styles.uploadIconWrap}>
                <FontAwesome5 name="camera" size={28} color={colors.primary} />
                <View style={styles.uploadIconPlus}>
                  <FontAwesome5 name="plus" size={10} color={colors.text.inverse} />
                </View>
              </View>
              <Text style={styles.uploadTitle}>Tap to upload</Text>
              <Text style={styles.uploadSubtitle}>Take a photo or choose from gallery</Text>
              <View style={styles.formatBadge}>
                <Text style={styles.formatText}>JPG • PNG • PDF</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.cameraButton,
                  pressed && styles.cameraButtonPressed,
                ]}
                onPress={openCamera}
              >
                <FontAwesome5 name="camera" size={14} color={colors.primary} />
                <Text style={styles.cameraButtonText}>Open Camera</Text>
              </Pressable>
            </>
          )}
        </Pressable>

        {/* RTO Validation Card */}
        <View style={styles.validationCard}>
          <FontAwesome5 name="shield-alt" size={20} color={colors.primary} />
          <View style={styles.validationText}>
            <Text style={styles.validationTitle}>RTO Validation Process</Text>
            <Text style={styles.validationBody}>
              Your ticket will be securely sent to the Registered Training Organisation (RTO)
              for validation. Verification typically takes{' '}
              <Text style={styles.validationBold}>24-48 hours</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Manual Entry Link */}
        <View style={styles.manualEntryRow}>
          <Text style={styles.troubleText}>Having trouble?</Text>
          <Pressable onPress={onManualEntry}>
            <Text style={styles.manualEntryLink}>Enter details manually</Text>
          </Pressable>
        </View>

        {/* Verify Button */}
        <Pressable
          style={[
            styles.verifyButton,
            !hasImage && styles.verifyButtonDisabled,
          ]}
          onPress={onVerifyTicket}
          disabled={!hasImage || verifying}
        >
          <Text style={[styles.verifyButtonText, !hasImage && styles.verifyButtonTextDisabled]}>
            {verifying ? 'Verifying...' : 'Verify Ticket'}
          </Text>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    width: 32,
    backgroundColor: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
  },
  titleSection: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.muted,
    lineHeight: 24,
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.bg.surface,
    paddingVertical: 40,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    minHeight: 280,
  },
  uploadZonePressed: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  uploadZoneWithImage: {
    padding: spacing.sm,
    minHeight: 200,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.bg.surfaceMuted,
  },
  uploadIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadIconPlus: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  formatBadge: {
    backgroundColor: colors.bg.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.primary}10`,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cameraButtonPressed: {
    backgroundColor: `${colors.primary}20`,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  validationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.primary}08`,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  validationText: {
    flex: 1,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  validationBody: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  validationBold: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  bottomActions: {
    backgroundColor: colors.bg.auth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  manualEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  troubleText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.muted,
  },
  manualEntryLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  verifyButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.bg.surfaceMuted,
    shadowOpacity: 0,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  verifyButtonTextDisabled: {
    color: colors.text.muted,
  },
});
