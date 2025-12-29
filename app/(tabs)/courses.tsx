import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const onManageBooking = useCallback(() => {
    // router.push(...)
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Upcoming Courses</Text>
        <Pressable 
          style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Filter courses"
        >
           <FontAwesome name="filter" size={16} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>My Schedule</Text>
          <Text style={styles.bannerSubtitle}>You have 3 upcoming sessions.</Text>
        </View>

        {/* Featured Course */}
        <Pressable 
          onPress={onManageBooking}
          style={({ pressed }) => [styles.featuredCard, pressed && styles.pressedCard]}
        >
          <ImageBackground
            source={{ uri: 'https://picsum.photos/600/400?random=30' }}
            style={styles.featuredBg}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
              style={styles.gradientOverlay}
            />
            
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Confirmed</Text>
            </View>

            <View style={styles.featuredContent}>
              <View style={styles.featuredDateRow}>
                <FontAwesome name="calendar" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.featuredDateText}>Oct 12 • 09:00 AM</Text>
              </View>
              <Text style={styles.featuredTitle}>Advanced First Aid</Text>
              <Text style={styles.featuredProvider}>Safety First Training</Text>
              
              <View style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>Manage Booking</Text>
                <FontAwesome name="arrow-right" size={12} color={colors.text.inverse} />
              </View>
            </View>
          </ImageBackground>
        </Pressable>

        {/* November List */}
        <View style={styles.monthSection}>
          <Text style={styles.monthTitle}>NOVEMBER</Text>
          
          <CourseItem 
            day="05" 
            month="NOV"
            title="White Card Induction" 
            provider="BuildSafe" 
            time="10:00 AM" 
            type="Online / Zoom" 
            iconType="video-camera"
          />
          
          <CourseItem 
            day="18" 
            month="NOV"
            title="Working at Heights" 
            provider="SafeWork Pro" 
            time="08:30 AM" 
            type="Training Center B" 
            iconType="map-marker"
            status="Payment Pending"
            statusColor={colors.warning}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function CourseItem({ 
  day, 
  month,
  title, 
  provider, 
  time, 
  type, 
  iconType, 
  status, 
  statusColor 
}: { 
  day: string; 
  month: string;
  title: string; 
  provider: string; 
  time: string; 
  type: string; 
  iconType: string;
  status?: string;
  statusColor?: string;
}) {
  return (
    <View style={styles.courseItem}>
      {status && <View style={[styles.statusLine, { backgroundColor: statusColor || colors.brand.blue }]} />}
      
      <View style={styles.courseContent}>
        <View style={styles.dateBox}>
          <Text style={[styles.dateMonth, status ? { color: statusColor } : { color: colors.brand.blue }]}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>
        
        <View style={styles.courseDetails}>
          <Text style={styles.courseTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.courseProvider}>{provider}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
               <FontAwesome name="clock-o" size={12} color={colors.text.muted} />
               <Text style={styles.metaText}>{time}</Text>
            </View>
            <View style={styles.metaItem}>
               <FontAwesome name={iconType as any} size={12} color={colors.text.muted} />
               <Text style={styles.metaText}>{type}</Text>
            </View>
          </View>
          
          {status && (
            <Text style={[styles.statusText, { color: statusColor || colors.warning }]}>
              {status}
            </Text>
          )}
        </View>
        
        <View style={styles.chevron}>
           <FontAwesome name="chevron-right" size={12} color={colors.text.muted} />
        </View>
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.app,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  banner: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bg.surface,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    marginTop: -spacing.md,
    paddingTop: spacing.lg + spacing.md,
    ...shadows.soft,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
  },
  bannerSubtitle: {
    color: colors.text.muted,
    marginTop: 4,
  },
  
  // Featured Card
  featuredCard: {
    marginHorizontal: spacing.lg,
    height: 320,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.card,
    backgroundColor: colors.text.primary,
  },
  featuredBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand.blue,
    textTransform: 'uppercase',
  },
  featuredContent: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  featuredDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredDateText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  featuredProvider: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  featuredButton: {
    height: 44,
    backgroundColor: colors.brand.blue,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  featuredButtonText: {
    color: colors.text.inverse,
    fontWeight: '800',
    fontSize: fontSizes.sm,
  },

  // Month Section
  monthSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  monthTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  
  // Course Item
  courseItem: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    ...shadows.soft,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  statusLine: {
    width: 6,
    backgroundColor: colors.brand.blue,
  },
  courseContent: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  dateBox: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.bg.app,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  courseDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  courseTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text.primary,
  },
  courseProvider: {
    fontSize: fontSizes.xs,
    color: colors.text.muted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  chevron: {
    justifyContent: 'center',
    paddingLeft: spacing.xs,
  },
  
  pressed: {
    opacity: 0.7,
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
});