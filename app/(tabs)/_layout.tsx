import React from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Tabs, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { colors, shadows } from '@/src/theme/tokens';

const TAB_BAR_HEIGHT = 78;

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  color: string;
}) {
  return <FontAwesome5 size={20} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <View style={styles.root}>
      <Tabs
        initialRouteName="wallet"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: 8,
            paddingBottom: insets.bottom + 8,
          },
          tabBarItemStyle: {
            paddingVertical: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            lineHeight: 12,
            fontWeight: '700',
            marginTop: 2,
            marginBottom: 0,
          },
        }}>
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'My Tickets',
            tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} />,
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Courses',
            tabBarIcon: ({ color }) => <TabBarIcon name="book-open" color={color} />,
          }}
        />
        <Tabs.Screen
          name="enrolment"
          options={{
            title: 'Enrolment',
            tabBarIcon: ({ color }) => <TabBarIcon name="clipboard-check" color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
          }}
        />
      </Tabs>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Training Wallet assistant"
        onPress={() => router.push('/(modals)/assistant')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + TAB_BAR_HEIGHT / 2 - FAB_SIZE / 2 },
          pressed ? styles.fabPressed : null,
        ]}
      >
        <LinearGradient colors={[colors.brand.cyan, colors.brand.blue]} style={styles.fabInner}>
          <FontAwesome5 name="comment-dots" size={18} color={colors.text.inverse} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const FAB_SIZE = 56;

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
  },
  fabInner: {
    flex: 1,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    transform: [{ scale: 0.98 }],
  },
});
