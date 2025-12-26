import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';

type UpcomingCourse = {
  id: string;
  title: string;
  provider: string;
  starts_at: string;
  location: string;
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CoursesScreen() {
  const courses = useMemo<UpcomingCourse[]>(
    () => [
      {
        id: 'course_first_aid_refresh',
        title: 'HLTAID011 Provide First Aid (Refresher)',
        provider: 'Search Training (Demo RTO)',
        starts_at: '2026-01-18T09:00:00.000Z',
        location: 'Sydney CBD',
      },
      {
        id: 'course_chainsaw_safety',
        title: 'Chainsaw Safety & Operations',
        provider: 'Search Training (Demo RTO)',
        starts_at: '2026-02-03T08:30:00.000Z',
        location: 'Newcastle',
      },
    ],
    []
  );

  const onManageBooking = useCallback(async () => {
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
        <Text style={styles.heroTitle}>Upcoming Courses</Text>
        <Text style={styles.heroSubtitle}>Your next sessions and bookings.</Text>
      </LinearGradient>

      <View style={styles.panel}>
        {courses.map((course) => (
          <View key={course.id} style={styles.card}>
            <Text style={styles.title} numberOfLines={2}>
              {course.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {course.provider}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <FontAwesome name="calendar" size={14} color="#0B1220" />
                <Text style={styles.metaPillText}>{formatDateTime(course.starts_at)}</Text>
              </View>
              <View style={styles.metaPill}>
                <FontAwesome name="map-marker" size={14} color="#0B1220" />
                <Text style={styles.metaPillText}>{course.location}</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onManageBooking}
              style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.secondaryButtonText}>Manage booking</Text>
            </Pressable>
          </View>
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
    gap: 12,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  title: {
    fontWeight: '900',
    color: '#0B1220',
    fontSize: 16,
  },
  meta: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  metaPillText: {
    fontWeight: '800',
    color: '#0B1220',
    fontSize: 12,
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
  pressed: {
    opacity: 0.92,
  },
});

