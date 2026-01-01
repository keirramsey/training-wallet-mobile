import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
import { useThemePreference } from '@/src/context/ThemePreferenceContext';
import { colors, fontSizes, layout, radii, shadows, spacing } from '@/src/theme/tokens';

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const stProfileUrl = 'https://searchtraining.com.au/profile';

  const cycleThemePreference = useCallback(() => {
    const order: Array<typeof preference> = ['system', 'light', 'dark'];
    const index = order.indexOf(preference);
    const next = order[(index + 1) % order.length];
    setPreference(next);
  }, [preference, setPreference]);

  const openUrl = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', url);
    }
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation handled by AuthContext
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  }, []);

  const menuItems: MenuItem[][] = [
    // Account Section
    [
      {
        id: 'personal',
        icon: 'user-edit',
        label: 'Personal Information',
        subtitle: 'Name, email, phone',
        onPress: () => router.push('/settings/personal'),
        showChevron: true,
      },
      {
        id: 'security',
        icon: 'shield-alt',
        label: 'Security',
        subtitle: 'Password, 2FA',
        onPress: () => router.push('/settings/security'),
        showChevron: true,
      },
    ],
    // Preferences Section
    [
      {
        id: 'notifications',
        icon: 'bell',
        label: 'Push Notifications',
        onPress: () => setNotificationsEnabled(!notificationsEnabled),
        rightElement: (
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.brand.cyan }}
            thumbColor={colors.bg.surface}
          />
        ),
      },
      {
        id: 'biometrics',
        icon: 'fingerprint',
        label: 'Biometric Login',
        subtitle: 'Face ID / Touch ID',
        onPress: () => setBiometricsEnabled(!biometricsEnabled),
        rightElement: (
          <Switch
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            trackColor={{ false: colors.border, true: colors.brand.cyan }}
            thumbColor={colors.bg.surface}
          />
        ),
      },
      {
        id: 'theme',
        icon: 'moon',
        label: 'Theme',
        subtitle: 'System / Light / Dark',
        onPress: cycleThemePreference,
        rightElement: (
          <View style={styles.themeToggle}>
            {(['system', 'light', 'dark'] as const).map((option) => {
              const isActive = preference === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setPreference(option)}
                  style={[styles.themeOption, isActive && styles.themeOptionActive]}
                >
                  <Text style={[styles.themeOptionText, isActive && styles.themeOptionTextActive]}>
                    {option === 'system' ? 'System' : option === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ),
      },
    ],
    // Support Section
    [
      {
        id: 'help',
        icon: 'question-circle',
        label: 'Help & Support',
        onPress: () => openUrl('mailto:support@trainingwallet.com.au'),
        showChevron: true,
      },
      {
        id: 'about',
        icon: 'info-circle',
        label: 'About Training Wallet',
        subtitle: 'Version 1.0.0',
        onPress: () => router.push('/about'),
        showChevron: true,
      },
      {
        id: 'privacy',
        icon: 'file-alt',
        label: 'Privacy Policy',
        onPress: () => openUrl('https://trainingwallet.com.au/privacy'),
        showChevron: true,
      },
    ],
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <FontAwesome5 name="user" size={32} color={colors.brand.blue} />
            </View>
          <Pressable
            style={styles.editAvatarButton}
            accessibilityRole="button"
            accessibilityLabel="Edit profile photo"
            onPress={() => openUrl(stProfileUrl)}
          >
            <FontAwesome5 name="camera" size={12} color={colors.text.inverse} />
          </Pressable>
          </View>
          <Text style={styles.userName}>{user?.name || 'Training Wallet User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Credentials</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Expiring</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            {section.map((item, itemIndex) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  itemIndex === 0 && styles.menuItemFirst,
                  itemIndex === section.length - 1 && styles.menuItemLast,
                  pressed && styles.menuItemPressed,
                ]}
              >
                <View style={styles.menuIconContainer}>
                  <FontAwesome5 name={item.icon} size={16} color={colors.brand.blue} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
                {item.rightElement ? (
                  item.rightElement
                ) : item.showChevron ? (
                  <FontAwesome5 name="chevron-right" size={12} color={colors.text.muted} />
                ) : null}
              </Pressable>
            ))}
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.dangerButton,
              pressed && styles.menuItemPressed,
            ]}
          >
            <FontAwesome5 name="sign-out-alt" size={16} color={colors.danger} />
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.dangerButton,
              styles.dangerButtonOutline,
              pressed && styles.menuItemPressed,
            ]}
          >
            <FontAwesome5 name="trash-alt" size={16} color={colors.danger} />
            <Text style={[styles.dangerButtonText, styles.dangerButtonTextOutline]}>
              Delete Account
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Training Wallet by Search Training
        </Text>
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
    paddingTop: spacing.md,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    color: colors.text.primary,
  },
  profileCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.brand.cyan,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  userName: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: fontSizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    color: colors.brand.blue,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.text.muted,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  menuSection: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemFirst: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  menuItemPressed: {
    backgroundColor: colors.bg.surfaceMuted,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(43, 201, 244, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  themeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surfaceMuted,
    borderRadius: radii.pill,
    padding: 3,
    gap: 4,
  },
  themeOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  themeOptionActive: {
    backgroundColor: colors.bg.surface,
    ...shadows.soft,
  },
  themeOptionText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text.muted,
  },
  themeOptionTextActive: {
    color: colors.text.primary,
  },
  menuLabel: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  menuSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  dangerSection: {
    gap: spacing.sm,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  dangerButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.danger,
  },
  dangerButtonTextOutline: {
    color: colors.danger,
  },
  footerText: {
    fontSize: fontSizes.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
