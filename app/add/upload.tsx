import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';
import { addLocalCredential } from '@/src/storage/credentialsStore';
import type { CredentialEvidence } from '@/src/types/credential';

export default function AddUploadScreen() {
  const router = useRouter();

  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

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

  const onContinue = useCallback(() => {
    if (!evidence) return;
    router.push({
      pathname: '/add/manual',
      params: {
        evidence_uri: evidence.uri,
        evidence_meta: JSON.stringify(evidence.meta ?? {}),
      },
    });
  }, [evidence, router]);

  const onSaveDraft = useCallback(async () => {
    if (!evidence) return;
    if (saving) return;

    try {
      setSaving(true);
      const created = await addLocalCredential({
        title: 'Uploaded credential (draft)',
        issuer_name: 'Unknown issuer',
        issued_at: new Date().toISOString(),
        expires_at: null,
        units: [],
        evidence: [evidence],
      });

      router.push({ pathname: '/wallet', params: { toast: 'saved', id: created.id } });
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [evidence, router, saving]);

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Upload Certificate</Text>
        <Text style={styles.heroSubtitle}>Add a photo now, then fill the details.</Text>
      </LinearGradient>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Step 1</Text>
        <Text style={styles.panelBody}>Capture a clear photo of your certificate.</Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={openCamera}
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.primaryButtonText}>Open Camera</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={pickFromLibrary}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.secondaryButtonText}>Choose from Library</Text>
          </Pressable>
        </View>
      </View>

      {asset && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Preview</Text>
          <View style={styles.previewRow}>
            <Image source={{ uri: asset.uri }} style={styles.previewImage} />
            <View style={styles.previewMeta}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {asset.fileName ?? 'Certificate image'}
              </Text>
              <Text style={styles.previewBody}>
                {typeof asset.fileSize === 'number' ? `${Math.round(asset.fileSize / 1024)} KB` : 'Size unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onContinue}
              disabled={!evidence}
              style={({ pressed }) => [
                styles.primaryButton,
                !evidence ? styles.disabled : null,
                pressed && evidence ? styles.pressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onSaveDraft}
              disabled={!evidence || saving}
              style={({ pressed }) => [
                styles.secondaryButton,
                !evidence || saving ? styles.disabled : null,
                pressed && evidence && !saving ? styles.pressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>{saving ? 'Saving…' : 'Save draft'}</Text>
            </Pressable>
          </View>
        </View>
      )}
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
    gap: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1220',
  },
  panelBody: {
    color: '#374151',
    fontWeight: '600',
    lineHeight: 20,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#0E89BA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
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
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.92,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewImage: {
    width: 86,
    height: 86,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  previewMeta: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    fontWeight: '900',
    color: '#0B1220',
  },
  previewBody: {
    color: '#6B7280',
    fontWeight: '600',
  },
});
