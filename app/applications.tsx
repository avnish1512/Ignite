import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Calendar, MapPin, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, RotateCw, ChevronDown, ChevronRight, Briefcase } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useJobs } from '@/hooks/jobs-store';
import { useTheme } from '@/hooks/theme-store';
import { formatSalary } from '@/hooks/salary-utils';
import StatusBadge from '@/components/StatusBadge';

export default function ApplicationsScreen() {
  const { student } = useAuth();
  const { getApplicationsForStudent, jobs } = useJobs();
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const onRefresh = () => {
    setIsRefreshing(true);
    setIsRefreshing(false);
  };

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'My Applications' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Please login to view applications</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allApplications = getApplicationsForStudent(student.id);
  
  // Group applications by job ID
  const applicationsByJob = new Map<string, typeof allApplications>();
  allApplications.forEach(app => {
    if (!applicationsByJob.has(app.jobId)) {
      applicationsByJob.set(app.jobId, []);
    }
    applicationsByJob.get(app.jobId)!.push(app);
  });

  // Create array of jobs with their applications
  const jobsWithApplications = Array.from(applicationsByJob.entries())
    .map(([jobId, applications]) => {
      const job = jobs.find(j => j.id === jobId);
      return {
        jobId,
        job,
        applications,
        jobTitle: job?.title || 'Job Removed',
        companyName: job?.company || 'Unknown Company',
        applicationCount: applications.length,
        statuses: applications.map(a => a.status),
      };
    })
    .sort((a, b) => {
      // Sort by status priority (offers first, then most recent)
      const hasOffer = (statuses: any[]) => statuses.some(s => s === 'Selected');
      if (hasOffer(b.statuses) && !hasOffer(a.statuses)) return 1;
      if (!hasOffer(b.statuses) && hasOffer(a.statuses)) return -1;
      return 0;
    });

  // Separate offers
  const offers = jobsWithApplications.filter(j => j.statuses.some(s => s === 'Selected'));
  const jobApplications = jobsWithApplications.filter(j => !j.statuses.some(s => s === 'Selected'));

  const renderJobHeader = (jobData: any) => (
    <TouchableOpacity 
      style={styles.jobGroupHeader}
      onPress={() => setExpandedJobId(expandedJobId === jobData.jobId ? null : jobData.jobId)}
    >
      <View style={styles.jobHeaderLeft}>
        <View style={styles.jobIconContainer}>
          <Briefcase size={20} color={theme.primary} />
        </View>
        <View style={styles.jobHeaderInfo}>
          <Text style={styles.jobHeaderTitle}>{jobData.jobTitle}</Text>
          <Text style={styles.jobHeaderCompany}>{jobData.companyName}</Text>
        </View>
      </View>
      <View style={styles.jobHeaderRight}>
        <View style={styles.applicationCountBadge}>
          <Text style={styles.applicationCountText}>{jobData.applicationCount}</Text>
        </View>
        {expandedJobId === jobData.jobId ? (
          <ChevronDown size={20} color={theme.textSecondary} />
        ) : (
          <ChevronRight size={20} color={theme.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderJobApplications = (jobData: any) => (
    <View style={styles.expandedContent}>
      {jobData.applications.map((application: any) => {
        const job = jobData.job;
        if (!job) return null;
        
        return (
          <View key={application.id} style={[
            styles.applicationCard,
            application.status === 'Rejected' && styles.rejectedCard
          ]}>
            <View style={styles.cardHeader}>
              <View style={styles.applicationInfo}>
                <Text style={styles.applicationStatus}>Status</Text>
                <StatusBadge status={application.status} />
              </View>
              <View style={styles.applicationDates}>
                <Clock size={14} color={theme.textMuted} />
                <Text style={styles.applicationDate}>
                  {new Date(application.appliedDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {job.location && (
              <View style={styles.jobDetailRow}>
                <MapPin size={14} color={theme.textMuted} />
                <Text style={styles.jobDetailText}>{job.location}</Text>
              </View>
            )}

            {job.ctc && (
              <View style={styles.jobDetailRow}>
                <DollarSign size={14} color={theme.textMuted} />
                <Text style={styles.jobDetailText}>{formatSalary(job.ctc)}</Text>
              </View>
            )}

            {application.adminNotes && (
              <View style={styles.jobDetailRow}>
                <AlertCircle size={14} color={theme.danger} />
                <Text style={[styles.jobDetailText, { color: theme.danger, fontWeight: '500' }]}>
                  {application.adminNotes}
                </Text>
              </View>
            )}

            <View style={styles.deadline}>
              <Text style={styles.deadlineText}>
                Deadline: {new Date(job.registrationDeadline).toLocaleDateString()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderJobGroup = (jobData: any) => (
    <View key={jobData.jobId} style={styles.jobGroup}>
      {renderJobHeader(jobData)}
      {expandedJobId === jobData.jobId && renderJobApplications(jobData)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'My Applications',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Applications & Offers</Text>
          <Text style={styles.subtitle}>
            {jobApplications.length} applied • {offers.length} offer{offers.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* OFFERS SECTION */}
        {offers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Accepted Offers</Text>
            </View>
            {offers.map(renderJobGroup)}
          </View>
        )}

        {/* JOB APPLICATIONS SECTION */}
        {jobApplications.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={theme.textMuted} />
              <Text style={styles.sectionTitle}>Job Applications</Text>
            </View>
            {jobApplications.map(renderJobGroup)}
          </View>
        ) : offers.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>No Applications Yet</Text>
            <Text style={styles.emptySubtitle}>Start applying to job opportunities to see them here</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof import('@/hooks/theme-store').useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 16,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      minHeight: 400,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      backgroundColor: theme.surfaceAlt,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    jobGroup: {
      marginBottom: 0,
    },
    jobGroupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 2,
      elevation: theme.isDark ? 0 : 1,
    },
    jobHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    jobIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    jobHeaderInfo: {
      flex: 1,
    },
    jobHeaderTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    jobHeaderCompany: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    jobHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    applicationCountBadge: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    applicationCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    expandedContent: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      overflow: 'hidden',
    },
    applicationCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.borderStrong,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 2,
      elevation: theme.isDark ? 0 : 1,
    },
    rejectedCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
      opacity: 0.85,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    applicationInfo: {
      flexDirection: 'column',
      gap: 4,
    },
    applicationStatus: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    applicationDates: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    applicationDate: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    jobDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    jobDetailText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    deadline: {
      paddingTop: 8,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    deadlineText: {
      fontSize: 11,
      color: theme.danger,
      fontWeight: '500',
    },
  });
}