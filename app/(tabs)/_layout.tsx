import React from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { colors } from '@/src/theme/tokens';

const TAB_BAR_HEIGHT = 65;

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  color: string;
  size?: number;
  solid?: boolean;
}) {
  return <FontAwesome5 size={props.size ?? 20} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
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
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            lineHeight: 12,
            fontWeight: '600',
            marginTop: 2,
            fontFamily: 'System', 
          },
        }}>
        {/* Tab 1: Wallet (Home) */}
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'My Tickets',
            tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} solid />,
          }}
        />

        {/* Tab 2: History */}
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
          }}
        />

        {/* Tab 3: Courses */}
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Courses',
            tabBarIcon: ({ color }) => <TabBarIcon name="calendar-alt" color={color} />,
          }}
        />

        {/* Tab 4: Enrolment */}
        <Tabs.Screen
          name="enrolment"
          options={{
            title: 'Enrolment',
            tabBarIcon: ({ color }) => <TabBarIcon name="user-check" color={color} />,
          }}
        />

        {/* Hidden Tabs (accessible via navigation but not in bar) */}
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
