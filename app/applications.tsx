import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Calendar, MapPin, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, RotateCw } from 'lucide-react-native';
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

  const onRefresh = () => {
    setIsRefreshing(true);
    // Simulate a refresh - the real-time listeners will update automatically
    setTimeout(() => setIsRefreshing(false), 500);
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
  
  // Separate applications into two sections
  const jobApplications = allApplications.filter(app => 
    app.status !== 'Selected'
  );
  const offers = allApplications.filter(app => 
    app.status === 'Selected'
  );

  console.log('Student applications loaded:', {
    studentId: student.id,
    total: allApplications.length,
    jobApplications: jobApplications.length,
    offers: offers.length,
    statuses: allApplications.map(a => ({ jobId: a.jobId, status: a.status }))
  });

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
            {jobApplications.length} applications • {offers.length} offer{offers.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* OFFERS SECTION - Show First */}
        {offers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Accepted Offers</Text>
            </View>
            <View style={styles.applicationsList}>
              {offers.map((application) => {
                const job = jobs.find(j => j.id === application.jobId);
                if (!job) return null;
                
                return (
                  <View key={application.id} style={styles.applicationCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{job.company}</Text>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                      </View>
                      <StatusBadge status={application.status} />
                    </View>
                    
                    <View style={styles.jobDetails}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color={theme.textMuted} />
                        <Text style={styles.detailText}>{job.location}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <DollarSign size={14} color={theme.textMuted} />
                        <Text style={styles.detailText}>{formatSalary(job.ctc)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={14} color={theme.textMuted} />
                        <Text style={styles.detailText}>
                          {application.lastUpdated 
                            ? `Selected ${new Date(application.lastUpdated).toLocaleDateString()}`
                            : 'Status pending'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.deadline}>
                      <Text style={styles.deadlineText}>
                        Deadline: {new Date(job.registrationDeadline).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* JOB APPLICATIONS SECTION */}
        {jobApplications.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={theme.textMuted} />
              <Text style={styles.sectionTitle}>Job Applications</Text>
            </View>
            <View style={styles.applicationsList}>
              {jobApplications.map((application) => {
                const job = jobs.find(j => j.id === application.jobId);
                if (!job) return null;
                
                return (
                  <View key={application.id} style={[
                    styles.applicationCard,
                    application.status === 'Rejected' && styles.rejectedCard
                  ]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{job.company}</Text>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                      </View>
                      <StatusBadge status={application.status} />
                    </View>
                    
                    <View style={styles.jobDetails}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color={theme.textMuted} />
                        <Text style={styles.detailText}>{job.location}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <DollarSign size={14} color={theme.textMuted} />
                        <Text style={styles.detailText}>{formatSalary(job.ctc)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={14} color={theme.textMuted} />
                        <Text style={styles.detailText}>Applied {new Date(application.appliedDate).toLocaleDateString()}</Text>
                      </View>
                      {application.adminNotes && (
                        <View style={styles.detailRow}>
                          <AlertCircle size={14} color={theme.danger} />
                          <Text style={[styles.detailText, { color: theme.danger, fontWeight: '500' }]}>
                            {application.adminNotes}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.deadline}>
                      <Text style={styles.deadlineText}>
                        Deadline: {new Date(job.registrationDeadline).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>No Job Applications Yet</Text>
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
    applicationsList: {
      padding: 16,
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
    applicationCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 2,
      elevation: theme.isDark ? 0 : 1,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.borderStrong,
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
      marginBottom: 12,
    },
    companyInfo: {
      flex: 1,
    },
    companyName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    jobTitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    jobDetails: {
      gap: 8,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    deadline: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    deadlineText: {
      fontSize: 12,
      color: theme.danger,
      fontWeight: '500',
    },
  });
}