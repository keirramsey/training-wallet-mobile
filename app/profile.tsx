import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';

type Row = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
};

export default function ProfileScreen() {
  const comingSoon = useCallback((title: string) => {
    Alert.alert('Coming soon', title);
  }, []);

  const rows: Row[] = [
    {
      title: 'Connect Search Training',
      subtitle: 'Sync credentials and renewals',
      icon: 'link',
      onPress: () => comingSoon('Connect Search Training'),
    },
    {
      title: 'Privacy & Sharing',
      subtitle: 'Control what you share',
      icon: 'lock',
      onPress: () => comingSoon('Privacy & Sharing'),
    },
    {
      title: 'Notifications',
      subtitle: 'Expiry reminders and updates',
      icon: 'bell',
      onPress: () => comingSoon('Notifications'),
    },
    {
      title: 'Help',
      subtitle: 'FAQs and support',
      icon: 'question-circle',
      onPress: () => comingSoon('Help'),
    },
    {
      title: 'Log out',
      subtitle: 'Sign out of the app',
      icon: 'sign-out',
      onPress: () => comingSoon('Log out'),
    },
  ];

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Profile</Text>
        <Text style={styles.heroSubtitle}>Manage your account and app settings.</Text>
      </LinearGradient>

      <View style={styles.panel}>
        {rows.map((row, index) => (
          <Pressable
            key={`${row.title}-${index}`}
            accessibilityRole="button"
            onPress={row.onPress}
            style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
          >
            <View style={styles.rowIcon}>
              <FontAwesome name={row.icon} size={18} color="#0E89BA" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
          </Pressable>
        ))}
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
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0B1220',
  },
  rowSubtitle: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  pressed: {
    backgroundColor: '#F3F4F6',
  },
});

