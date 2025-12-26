import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';

export default function EnrolmentScreen() {
  const onOpenSearchTraining = useCallback(async () => {
    await Linking.openURL('https://searchtraining.com.au');
  }, []);

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#2BC9F4', '#0E89BA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Enrolment</Text>
        <Text style={styles.heroSubtitle}>Find a course and enrol in minutes.</Text>
      </LinearGradient>

      <View style={styles.panel}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <FontAwesome name="search" size={18} color="#0E89BA" />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>Search courses</Text>
            <Text style={styles.body}>Browse options without sharing personal info.</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpenSearchTraining}
          style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.primaryButtonText}>Open Search Training</Text>
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
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B1220',
  },
  body: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: '#0E89BA',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.92,
  },
});

