import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, FileText, Building2, TrendingUp, Flame, Sparkles, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useJobs } from '@/hooks/jobs-store';
import { useNotifications } from '@/hooks/notifications-store';
import { useTheme } from '@/hooks/theme-store';
import { formatSalaryLPA } from '@/hooks/salary-utils';
import { getDynamicGreeting, sanitizeText, capitalizeWords } from '@/hooks/text-utils';
import { HomeSkeleton } from '@/components/SkeletonLoader';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { student } = useAuth();
  const theme = useTheme();
  const { jobs, isLoading, getApplicationsForStudent, loadData } = useJobs();
  const { unreadCount, initializeNotifications } = useNotifications();
  const [applicationCount, setApplicationCount] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const styles = React.useMemo(() => makeStyles(theme), [theme]);

  // Show only the 5 most recent jobs on the home screen
  const recentJobs = React.useMemo(() => jobs.slice(0, 5), [jobs]);

  useFocusEffect(
    React.useCallback(() => {
      if (student?.id) {
        // Load real-time notifications
        initializeNotifications(student.id);
        // Get student applications count
        const apps = getApplicationsForStudent(student.id);
        setApplicationCount(apps.length);
      }
    }, [student?.id, initializeNotifications, getApplicationsForStudent])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginTitle}>Ignite Placement Portal</Text>
          <Text style={styles.loginSubtitle}>Please login to access opportunities</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Flame size={20} color={theme.primary} fill={theme.primary} />
          <Text style={styles.headerBrand}>Ignite</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/notifications' as any)}
        >
          <Bell size={24} color={theme.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <HomeSkeleton />
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          }
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>{getDynamicGreeting()},</Text>
            <Text style={styles.studentName}>{capitalizeWords(student.name)}</Text>
            <Text style={styles.universityName}>Ignite Student Portal</Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <FileText size={28} color="#E2231A" />
              <Text style={styles.statValue}>{applicationCount}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
            <View style={styles.statCard}>
              <Building2 size={28} color="#3B82F6" />
              <Text style={styles.statValue}>{jobs.length}</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={28} color="#8B5CF6" />
              <Text style={styles.statValue}>{student.cgpa || 0}</Text>
              <Text style={styles.statLabel}>CGPA</Text>
            </View>
          </View>


          {/* Recent Updates Section - Real-time Jobs */}
          <View style={styles.updatesSection}>
            <Text style={styles.sectionTitle}>Recent Job Openings</Text>
            
            {recentJobs.length > 0 ? (
              recentJobs.map(job => (
                <TouchableOpacity 
                  key={job.id}
                  style={styles.updateCard}
                  onPress={() => router.push(`/job/${job.id}` as any)}
                >
                  <View style={styles.updateIcon}>
                    <Building2 size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.updateContent}>
                    <Text style={styles.updateTitle}>{job.title} at {job.company}</Text>
                    <Text style={styles.updateDescription} numberOfLines={2}>
                      {sanitizeText(job.description, 'Position available for eligible candidates')}
                    </Text>
                    <View style={styles.jobMetaInfo}>
                      <Text style={styles.location}>📍 {job.location}</Text>
                      <Text style={styles.salary}>💰 {formatSalaryLPA(job.ctc)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Job Openings</Text>
                <Text style={styles.emptySubtitle}>Check back soon for new opportunities</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    brandContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerBrand: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.primary,
      letterSpacing: 0.5,
    },
    notificationButton: {
      position: 'relative',
      padding: 8,
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: theme.danger,
      borderRadius: 10,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.surface,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    welcomeSection: {
      marginTop: 16,
      marginBottom: 20,
    },
    welcomeText: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '500',
    },
    studentName: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
      marginTop: 2,
    },
    universityName: {
      fontSize: 14,
      color: theme.danger,
      fontWeight: '600',
      marginTop: 4,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surfaceAlt,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderStrong,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    updatesSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    updateCard: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: theme.borderStrong,
    },
    updateIcon: {
      backgroundColor: theme.danger,
      borderRadius: 8,
      padding: 10,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    updateContent: {
      flex: 1,
    },
    updateTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    updateDescription: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    jobMetaInfo: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 6,
    },
    location: {
      fontSize: 11,
      color: theme.textMuted,
    },
    salary: {
      fontSize: 11,
      color: theme.success,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    emptySubtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 4,
    },
    loginPrompt: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loginTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    loginSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });
}
