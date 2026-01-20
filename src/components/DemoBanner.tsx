import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/theme/tokens';

export function DemoBanner() {
  const { session, logout } = useAuth();
  const insets = useSafeAreaInsets();

  if (!session?.isDemo) return null;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
      <View style={[styles.content, { marginTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <View style={styles.left}>
          <View style={styles.badge}>
            <FontAwesome5 name="flask" size={10} color="white" />
            <Text style={styles.badgeText}>DEMO</Text>
          </View>
          <Text style={styles.infoText}>Local Data</Text>
        </View>
        <Pressable 
          onPress={() => logout()} 
          style={({ pressed }) => [styles.exitButton, pressed && { opacity: 0.8 }]}
          hitSlop={8}
        >
          <Text style={styles.exitText}>Exit</Text>
          <FontAwesome5 name="times" size={12} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b', // Slate 800
    zIndex: 9999,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    height: 44, // Touch target friendly
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoText: {
    color: '#94a3b8', // Slate 400
    fontSize: 12,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exitText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
