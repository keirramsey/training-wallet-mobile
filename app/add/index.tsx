import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ScreenContainer';

export default function AddScreen() {
  const router = useRouter();

  const onUpload = useCallback(() => {
    router.push('/add/upload');
  }, [router]);

  const onManual = useCallback(() => {
    router.push('/add/manual');
  }, [router]);

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Add Training</Text>
        <Text style={styles.heroSubtitle}>Bring certificates into your wallet.</Text>
      </LinearGradient>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onUpload}
          style={({ pressed }) => [styles.actionCard, pressed ? styles.pressed : null]}
        >
          <View style={styles.actionIcon}>
            <FontAwesome name="upload" size={20} color="#0E89BA" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Upload certificate</Text>
            <Text style={styles.actionBody}>PDF or photo (coming next)</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color="#6B7280" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onManual}
          style={({ pressed }) => [styles.actionCard, pressed ? styles.pressed : null]}
        >
          <View style={styles.actionIcon}>
            <FontAwesome name="keyboard-o" size={20} color="#0E89BA" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Enter details manually</Text>
            <Text style={styles.actionBody}>Quick form to capture basics</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color="#6B7280" />
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
  actions: {
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1220',
  },
  actionBody: {
    marginTop: 3,
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.92,
  },
});

