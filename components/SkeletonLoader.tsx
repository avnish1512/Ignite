import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/theme-store';

const { width: screenWidth } = Dimensions.get('window');

// ─── Base Skeleton Box ──────────────────────────────────────────────────────

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonBox({ width, height, borderRadius = 8, style }: SkeletonBoxProps) {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const bgColor = theme.isDark ? '#2C2C2E' : '#E5E7EB';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: bgColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Job Card Skeleton ──────────────────────────────────────────────────────

export function JobCardSkeleton() {
  const theme = useTheme();

  return (
    <View style={[skeletonStyles.card, { backgroundColor: theme.surface }]}>
      {/* Header row: logo + title */}
      <View style={skeletonStyles.cardHeader}>
        <SkeletonBox width={48} height={48} borderRadius={12} />
        <View style={skeletonStyles.cardHeaderText}>
          <SkeletonBox width="70%" height={16} borderRadius={4} />
          <SkeletonBox width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
          <SkeletonBox width="30%" height={10} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox width={72} height={24} borderRadius={12} />
      </View>

      {/* Skills tags */}
      <View style={skeletonStyles.tagsRow}>
        <SkeletonBox width={60} height={24} borderRadius={12} />
        <SkeletonBox width={80} height={24} borderRadius={12} />
        <SkeletonBox width={50} height={24} borderRadius={12} />
      </View>

      {/* Detail grid */}
      <View style={skeletonStyles.gridRow}>
        <View style={skeletonStyles.gridItem}>
          <SkeletonBox width="60%" height={10} borderRadius={4} />
          <SkeletonBox width="80%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={skeletonStyles.gridItem}>
          <SkeletonBox width="60%" height={10} borderRadius={4} />
          <SkeletonBox width="80%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Footer */}
      <View style={[skeletonStyles.footer, { borderTopColor: theme.border }]}>
        <SkeletonBox width="60%" height={10} borderRadius={4} />
        <SkeletonBox width={80} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

// ─── Home Dashboard Skeleton ────────────────────────────────────────────────

export function HomeSkeleton() {
  const theme = useTheme();

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Welcome */}
      <View style={{ marginTop: 16, marginBottom: 20 }}>
        <SkeletonBox width={120} height={14} borderRadius={4} />
        <SkeletonBox width={180} height={22} borderRadius={4} style={{ marginTop: 6 }} />
        <SkeletonBox width={60} height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>

      {/* Stats */}
      <View style={skeletonStyles.statsRow}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[skeletonStyles.statCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderStrong }]}>
            <SkeletonBox width={28} height={28} borderRadius={14} />
            <SkeletonBox width={32} height={20} borderRadius={4} style={{ marginTop: 8 }} />
            <SkeletonBox width={56} height={10} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      {/* Section title */}
      <SkeletonBox width={160} height={16} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* Job cards */}
      {[1, 2, 3].map(i => (
        <View key={i} style={[skeletonStyles.homeJobCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderStrong }]}>
          <SkeletonBox width={44} height={44} borderRadius={8} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonBox width="80%" height={14} borderRadius={4} />
            <SkeletonBox width="60%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <SkeletonBox width={80} height={10} borderRadius={4} />
              <SkeletonBox width={100} height={10} borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Message List Skeleton ──────────────────────────────────────────────────

export function MessageSkeleton() {
  const theme = useTheme();

  return (
    <View>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[skeletonStyles.messageItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <SkeletonBox width={50} height={50} borderRadius={25} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <SkeletonBox width={120} height={14} borderRadius={4} />
              <SkeletonBox width={50} height={12} borderRadius={4} />
            </View>
            <SkeletonBox width="80%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  homeJobCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
});
