import type { ReactElement, ReactNode } from 'react';
import type { RefreshControlProps, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { colors, layout, spacing } from '@/src/theme/tokens';

type Props = {
  children: ReactNode;
  maxWidth?: number;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: ReactElement<RefreshControlProps>;
};

export function ScreenContainer({
  children,
  maxWidth = layout.maxWidth,
  scroll = true,
  style,
  contentContainerStyle,
  refreshControl,
}: Props) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          refreshControl={refreshControl}
        >
          <View style={[styles.inner, { maxWidth }, style]}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.inner, { maxWidth }, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.md,
  },
});
