import React from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AIAgentIcon } from '@/components/icons/AIAgentIcon';
import { accessibility, aiAssistant, colors, shadows } from '@/src/theme/tokens';

const TAB_BAR_HEIGHT = 60;
const AI_BUTTON_SIZE = 56;

// Tab bar icon component with 44pt touch target
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  color: string;
  size?: number;
  solid?: boolean;
}) {
  return (
    <View style={styles.iconContainer}>
      <FontAwesome5 size={props.size ?? 22} {...props} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;
  const handleAIAssistant = () => {
    router.push('/assistant');
  };

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
          tabBarShowLabel: false, // Icons only
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: 12,
            paddingBottom: insets.bottom + 8,
            backgroundColor: colors.bg.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            ...shadows.soft,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}>
        {/* Tab 1: Wallet (Home) */}
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} solid />,
            tabBarAccessibilityLabel: 'Wallet',
          }}
        />

        {/* Tab 2: History */}
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
            tabBarAccessibilityLabel: 'History',
          }}
        />

        {/* Tab 3: AI Assistant */}
        <Tabs.Screen
          name="ai"
          options={{
            title: 'AI Assistant',
            tabBarButton: ({ accessibilityState }) => (
              <Pressable
                onPress={handleAIAssistant}
                style={({ pressed }) => [
                  styles.aiButton,
                  {
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Ask AI Assistant"
                accessibilityState={accessibilityState}
              >
                <LinearGradient
                  colors={[aiAssistant.gradient.from, aiAssistant.gradient.to]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiButtonGradient}
                >
                  <AIAgentIcon size={22} />
                </LinearGradient>
              </Pressable>
            ),
          }}
        />

        {/* Tab 4: Courses */}
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Courses',
            tabBarIcon: ({ color }) => <TabBarIcon name="calendar-alt" color={color} />,
            tabBarAccessibilityLabel: 'Courses',
          }}
        />

        {/* Tab 5: Enrolment */}
        <Tabs.Screen
          name="enrolment"
          options={{
            title: 'Enrolment',
            tabBarIcon: ({ color }) => <TabBarIcon name="user-check" color={color} />,
            tabBarAccessibilityLabel: 'Enrolment',
          }}
        />

        {/* Hidden Tabs (accessible via navigation but not in bar) */}
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="upcoming"
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
  iconContainer: {
    width: accessibility.touchTarget,
    height: accessibility.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButton: {
    width: AI_BUTTON_SIZE,
    height: AI_BUTTON_SIZE,
    borderRadius: AI_BUTTON_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.bg.surface,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30, // Align center closer to the tab bar top edge
    alignSelf: 'center',
    ...shadows.card,
  },
  aiButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: AI_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
