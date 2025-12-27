import React from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Tabs, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { colors, radii, shadows } from '@/src/theme/tokens';

const TAB_BAR_HEIGHT = 70;
const FAB_SIZE = 60;

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome5 size={props.size ?? 20} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  // Colors
  const activeColor = colors.brand.blue;
  const inactiveColor = colors.text.muted;

  return (
    <View style={styles.root}>
      <Tabs
        initialRouteName="wallet"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: 8,
            paddingBottom: insets.bottom + 4,
            backgroundColor: colors.bg.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            lineHeight: 12,
            fontWeight: '600',
            marginTop: 2,
          },
        }}>
        {/* Tab 1: Wallet (Home) */}
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} />,
          }}
        />

        {/* Tab 2: Explore/Search Training */}
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
          }}
        />

        {/* Tab 3: Placeholder for center FAB */}
        <Tabs.Screen
          name="enrolment"
          options={{
            title: '',
            tabBarIcon: () => <View style={{ width: FAB_SIZE }} />,
            tabBarButton: () => <View style={{ width: FAB_SIZE + 16 }} />,
          }}
        />

        {/* Tab 4: Share */}
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
          }}
        />

        {/* Tab 5: Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>

      {/* Central AI Assistant Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Training Wallet AI Assistant"
        onPress={() => router.push('/(modals)/assistant')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + TAB_BAR_HEIGHT / 2 - FAB_SIZE / 2 + 4 },
          pressed ? styles.fabPressed : null,
        ]}
      >
        <LinearGradient
          colors={[colors.brand.cyan, colors.brand.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <FontAwesome5 name="robot" size={24} color={colors.text.inverse} />
        </LinearGradient>
        {/* White ring around FAB */}
        <View style={styles.fabRing} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    ...shadows.card,
    zIndex: 100,
  },
  fabInner: {
    flex: 1,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg.surface,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  fabRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: (FAB_SIZE + 6) / 2,
    borderWidth: 3,
    borderColor: colors.bg.surface,
    ...shadows.soft,
  },
});
