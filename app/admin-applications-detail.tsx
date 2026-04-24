import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Building2, Calendar, CheckCircle, XCircle, Clock, Briefcase } from 'lucide-react-native';
import { useJobs } from '@/hooks/jobs-store';
import { useNotifications } from '@/hooks/notifications-store';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export default function AdminApplicationsDetail() {
  const { jobId, jobTitle, companyName } = useLocalSearchParams<{
    jobId: string;
    jobTitle: string;
    companyName: string;
  }>();
  
  const { applications, updateApplicationStatus } = useJobs();
  const { triggerApplicationStatusNotification } = useNotifications();
  const [updating, setUpdating] = useState(false);

  // Get applications for this specific job
  const jobApplications = (applications || [])
    .filter(app => app.jobId === jobId)
    .map(app => ({
      id: app.id,
      jobId: app.jobId,
      studentId: app.studentId,
      studentName: app.studentName || `Student ${app.studentId.slice(0, 4)}`,
      studentEmail: app.studentEmail || `student${app.studentId}@sgu.edu.in`,
      appliedDate: app.appliedDate,
      status: app.status as 'Applied' | 'Shortlisted' | 'Interviewing' | 'Rejected' | 'Under Review' | 'Selected',
      studentCourse: app.studentCourse || 'B.Tech (Course Info Pending)',
      studentYear: app.studentYear || '3rd Year',
      studentCGPA: app.studentCGPA || 8.0,
      adminNotes: app.adminNotes || ''
    }))
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

  const handleStatusChange = async (applicationId: string, newStatus: 'Applied' | 'Shortlisted' | 'Interviewing' | 'Rejected' | 'Under Review' | 'Selected') => {
    try {
      setUpdating(true);
      const result = await updateApplicationStatus(applicationId, newStatus);
      setUpdating(false);
      
      if (result.success) {
        const appInfo = jobApplications.find(a => a.id === applicationId);
        if (appInfo && appInfo.studentId) {
          triggerApplicationStatusNotification(
            appInfo.studentId,
            newStatus,
            jobTitle || 'Job',
            companyName || 'Company',
            jobId
          );
        }
        
        Alert.alert('Success', `Application status updated to ${newStatus}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to update status');
      }
    } catch (error) {
      setUpdating(false);
      Alert.alert('Error', 'An unexpected error occurred while updating status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Applied':
        return <Clock size={16} color="#F59E0B" />;
      case 'Shortlisted':
        return <CheckCircle size={16} color="#10B981" />;
      case 'Rejected':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return '#F59E0B';
      case 'Shortlisted':
        return '#10B981';
      case 'Interviewing':
        return '#6366F1';
      case 'Selected':
        return '#059669';
      case 'Rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const ApplicationCard = ({ 
    application 
  }: { 
    application: {
      id: string;
      jobId: string;
      studentId: string;
      studentName: string;
      studentEmail: string;
      appliedDate: string;
      status: 'Applied' | 'Shortlisted' | 'Interviewing' | 'Rejected' | 'Under Review' | 'Selected';
      studentCourse: string;
      studentYear: string;
      studentCGPA: number | string;
      adminNotes: string;
    }
  }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <View style={styles.applicationInfo}>
          <Text style={styles.studentName}>{application.studentName}</Text>
          <View style={styles.applicationMeta}>
            <View style={styles.metaItem}>
              <User size={14} color="#6B7280" />
              <Text style={styles.metaText}>{application.studentCourse}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.metaText}>{new Date(application.appliedDate).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '20' }]}>
          {getStatusIcon(application.status)}
          <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
            {application.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.studentDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{application.studentEmail}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>CGPA:</Text>
          <Text style={styles.detailValue}>{application.studentCGPA}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Year:</Text>
          <Text style={styles.detailValue}>{application.studentYear}</Text>
        </View>
      </View>
      
      {(application.status === 'Applied') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shortlistButton, updating && styles.buttonDisabled]}
            onPress={() => handleStatusChange(application.id, 'Shortlisted')}
            disabled={updating}
          >
            <CheckCircle size={16} color="#FFFFFF" />
            <Text style={styles.shortlistButtonText}>{updating ? 'Updating...' : 'Shortlist'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton, updating && styles.buttonDisabled]}
            onPress={() => handleStatusChange(application.id, 'Rejected')}
            disabled={updating}
          >
            <XCircle size={16} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>{updating ? 'Updating...' : 'Reject'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {(application.status === 'Shortlisted') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#6366F1' }, updating && styles.buttonDisabled]}
            onPress={() => handleStatusChange(application.id, 'Interviewing')}
            disabled={updating}
          >
            <Clock size={16} color="#FFFFFF" />
            <Text style={styles.shortlistButtonText}>{updating ? 'Updating...' : 'Interviewing'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton, updating && styles.buttonDisabled]}
            onPress={() => handleStatusChange(application.id, 'Rejected')}
            disabled={updating}
          >
            <XCircle size={16} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>{updating ? 'Updating...' : 'Reject'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {(application.status === 'Interviewing') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#059669' }, updating && styles.buttonDisabled]}
            onPress={() => handleStatusChange(application.id, 'Selected')}
            disabled={updating}
          >
            <CheckCircle size={16} color="#FFFFFF" />
            <Text style={styles.shortlistButtonText}>{updating ? 'Updating...' : 'Select'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton, updating && styles.buttonDisabled]}
            onPress={() => handleStatusChange(application.id, 'Rejected')}
            disabled={updating}
          >
            <XCircle size={16} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>{updating ? 'Updating...' : 'Reject'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const stats = {
    total: jobApplications.length,
    applied: jobApplications.filter(app => app.status === 'Applied').length,
    shortlisted: jobApplications.filter(app => app.status === 'Shortlisted').length,
    rejected: jobApplications.filter(app => app.status === 'Rejected').length
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: jobTitle || 'Job Applications',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#111827', fontWeight: 'bold' }
        }}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Briefcase size={24} color="#6366F1" />
          </View>
          <Text style={styles.headerTitle}>{jobTitle}</Text>
          <Text style={styles.headerSubtitle}>{companyName}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statTitle}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.applied}</Text>
            <Text style={styles.statTitle}>Applied</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.shortlisted}</Text>
            <Text style={styles.statTitle}>Shortlisted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.rejected}</Text>
            <Text style={styles.statTitle}>Rejected</Text>
          </View>
        </View>

        {/* Applications List */}
        <View style={styles.applicationsListContainer}>
          <Text style={styles.resultsText}>
            {jobApplications.length} application{jobApplications.length !== 1 ? 's' : ''}
          </Text>
          
          {jobApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
          
          {jobApplications.length === 0 && (
            <View style={styles.emptyState}>
              <Briefcase size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No applications</Text>
              <Text style={styles.emptyStateText}>No students have applied to this job yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: isTablet ? 32 : 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: isTablet ? 0 : -16,
    paddingHorizontal: isTablet ? 24 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 24,
  },
  headerIcon: {
    width: isTablet ? 64 : 48,
    height: isTablet ? 64 : 48,
    borderRadius: isTablet ? 32 : 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: isTablet ? 16 : 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: isTablet ? 12 : 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  applicationsListContainer: {
    paddingBottom: 24,
  },
  resultsText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  applicationMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: isTablet ? 12 : 11,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
  },
  studentDetails: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: isTablet ? 14 : 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: isTablet ? 14 : 12,
    color: '#111827',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 8,
    gap: 4,
  },
  shortlistButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  shortlistButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButtonText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
