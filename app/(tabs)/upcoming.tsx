import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiFetch } from '@/src/lib/api';
import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';

type UpcomingCourse = {
  id: string;
  title: string;
  provider: string;
  date: string;
  location: string;
};

const DEMO_COURSES: UpcomingCourse[] = [
  {
    id: 'up_1',
    title: 'Traffic Control Refresher',
    provider: 'Roads Authority NSW',
    date: 'Jan 15, 2025',
    location: 'Sydney, NSW',
  },
  {
    id: 'up_2',
    title: 'Working at Heights',
    provider: 'SafeWork Australia',
    date: 'Feb 2, 2025',
    location: 'Brisbane, QLD',
  },
];

const ST_COURSES_URL = 'https://searchtraining.com.au/courses';

function parseUpcomingCourses(payload: unknown): UpcomingCourse[] {
  if (Array.isArray(payload)) return payload as UpcomingCourse[];
  if (payload && typeof payload === 'object') {
    const anyPayload = payload as { items?: unknown };
    if (Array.isArray(anyPayload.items)) return anyPayload.items as UpcomingCourse[];
  }
  throw new Error('Unexpected upcoming courses response');
}

export default function UpcomingCoursesScreen() {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<UpcomingCourse[]>([]);
  const [demoMode, setDemoMode] = useState(false);

  const openSearchTraining = useCallback(() => {
    Linking.openURL(ST_COURSES_URL).catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setDemoMode(false);
        const response = await apiFetch('/api/courses/upcoming');
        const parsed = parseUpcomingCourses(response);
        if (isMounted) setCourses(parsed);
      } catch {
        if (isMounted) {
          setCourses(DEMO_COURSES);
          setDemoMode(true);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {demoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Demo mode · showing upcoming course samples</Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>Upcoming courses</Text>
          <Text style={styles.subtitle}>Linked to Search Training enrolments.</Text>
        </View>

        <View style={styles.list}>
          {courses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseProvider}>{course.provider}</Text>
              </View>
              <View style={styles.courseMetaRow}>
                <FontAwesome5 name="calendar-alt" size={12} color={colors.text.muted} />
                <Text style={styles.courseMeta}>{course.date}</Text>
                <FontAwesome5 name="map-marker-alt" size={12} color={colors.text.muted} />
                <Text style={styles.courseMeta}>{course.location}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={openSearchTraining}
          style={({ pressed }) => [styles.stButton, pressed && styles.stButtonPressed]}
        >
          <Text style={styles.stButtonText}>Open Search Training</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  demoBanner: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(14, 137, 186, 0.12)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  demoBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.blue,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.muted,
  },
  list: {
    gap: spacing.md,
  },
  courseCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.soft,
  },
  courseTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text.primary,
  },
  courseProvider: {
    fontSize: fontSizes.xs,
    color: colors.text.muted,
    marginTop: 4,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  courseMeta: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  stButton: {
    marginTop: spacing.md,
    backgroundColor: colors.brand.blue,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.soft,
  },
  stButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  stButtonText: {
    color: colors.text.inverse,
    fontWeight: '700',
    fontSize: 15,
  },
});
