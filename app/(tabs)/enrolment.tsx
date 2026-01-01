import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';
import { apiFetch } from '@/src/lib/api';

type EnrolmentProfile = {
  completion: number;
  address: string;
  educationLevel: string;
  verified: boolean;
};

const DEMO_PROFILE: EnrolmentProfile = {
  completion: 70,
  address: '124 Training Avenue',
  educationLevel: 'Year 12 or equivalent',
  verified: true,
};

const ST_PROFILE_URL = 'https://searchtraining.com.au/profile';

export default function EnrolmentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<EnrolmentProfile>(DEMO_PROFILE);
  const [demoMode, setDemoMode] = useState(false);

  const onSave = useCallback(() => {
    Linking.openURL(ST_PROFILE_URL).catch(() => {});
  }, []);

  const onOpenUpcoming = useCallback(() => {
    router.push('/(tabs)/upcoming');
  }, [router]);

  const onOpenSearchTraining = useCallback(() => {
    Linking.openURL('https://searchtraining.com.au').catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        setDemoMode(false);
        const response = await apiFetch<unknown>('/api/enrolment/profile');
        if (typeof response === 'object' && response) {
          const anyResponse = response as Partial<EnrolmentProfile>;
          const resolved: EnrolmentProfile = {
            completion: typeof anyResponse.completion === 'number' ? anyResponse.completion : DEMO_PROFILE.completion,
            address: typeof anyResponse.address === 'string' ? anyResponse.address : DEMO_PROFILE.address,
            educationLevel: typeof anyResponse.educationLevel === 'string' ? anyResponse.educationLevel : DEMO_PROFILE.educationLevel,
            verified: typeof anyResponse.verified === 'boolean' ? anyResponse.verified : DEMO_PROFILE.verified,
          };
          if (isMounted) setProfile(resolved);
          return;
        }
        if (isMounted) {
          setProfile(DEMO_PROFILE);
          setDemoMode(true);
        }
      } catch {
        if (isMounted) {
          setProfile(DEMO_PROFILE);
          setDemoMode(true);
        }
      }
    };
    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>My Enrolment Info</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {demoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Demo mode · showing sample enrolment data</Text>
          </View>
        )}

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Profile Completion</Text>
            <Text style={styles.progressValue}>{profile.completion}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${profile.completion}%` }]} />
          </View>
          <Text style={styles.progressHint}>Please verify your details to complete your profile.</Text>
        </View>

        <View style={styles.cardsContainer}>
          <Pressable
            style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
            onPress={onOpenUpcoming}
          >
            <View>
              <Text style={styles.linkTitle}>Upcoming courses</Text>
              <Text style={styles.linkSubtitle}>View your Search Training schedule</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={14} color={colors.text.muted} />
          </Pressable>

          {/* Personal Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                 <FontAwesome5 name="user" size={16} color={colors.brand.blue} />
                 <Text style={styles.cardTitle}>Personal Details</Text>
              </View>
              {profile.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Residential Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={profile.address}
                  editable={false}
                />
              </View>
            </View>
          </View>

          {/* Education History Card */}
          <View style={styles.card}>
            <View style={styles.orangeDot} />
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                 <FontAwesome5 name="graduation-cap" size={16} color={colors.brand.blue} />
                 <Text style={styles.cardTitle}>Education History</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Highest school level</Text>
              <Pressable style={styles.selectInput} onPress={onOpenSearchTraining}>
                <Text style={styles.inputText}>{profile.educationLevel}</Text>
                <FontAwesome name="chevron-down" size={12} color={colors.text.muted} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Pressable 
          onPress={onSave}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Text style={styles.saveButtonText}>Save & Confirm</Text>
          <FontAwesome name="check-circle" size={16} color={colors.text.inverse} />
        </Pressable>
      </View>
    </View>
  );
}

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
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  demoBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(14, 137, 186, 0.12)',
    alignSelf: 'flex-start',
  },
  demoBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.blue,
  },
  
  // Progress
  progressSection: {
    padding: spacing.xl,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
  progressValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.brand.blue,
  },
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.brand.blue,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 11,
    color: colors.text.muted,
  },

  // Cards
  cardsContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  linkCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.soft,
  },
  linkCardPressed: {
    backgroundColor: colors.bg.surfaceMuted,
  },
  linkTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text.primary,
  },
  linkSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.text.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text.primary,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  orangeDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  
  // Fields
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  inputWrapper: {
    backgroundColor: colors.bg.app,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.text.primary,
  },
  selectInput: {
    height: 44,
    backgroundColor: colors.bg.app,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  inputText: {
    fontSize: fontSizes.sm,
    color: colors.text.primary,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.brand.blue,
    height: 52,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  saveButtonText: {
    color: colors.text.inverse,
    fontWeight: '800',
    fontSize: fontSizes.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
