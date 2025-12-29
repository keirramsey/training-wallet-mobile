import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';

export default function EnrolmentScreen() {
  const insets = useSafeAreaInsets();
  // const router = useRouter();

  const onSave = useCallback(() => {
    // Save logic
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>My Enrolment Info</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Compliance Check</Text>
            <Text style={styles.progressValue}>70%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '70%' }]} />
          </View>
          <Text style={styles.progressHint}>Please verify your details for AVETMISS compliance.</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Personal Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                 <FontAwesome5 name="user" size={16} color={colors.brand.blue} />
                 <Text style={styles.cardTitle}>Personal Details</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Residential Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input} 
                  defaultValue="124 Training Avenue" 
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
              <Pressable style={styles.selectInput}>
                <Text style={styles.inputText}>Year 12 or equivalent</Text>
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