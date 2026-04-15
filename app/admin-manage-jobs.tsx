import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft, Search, Briefcase, MapPin, Trash2, Eye,
  Users, Plus, Filter, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react-native';
import { useJobs } from '@/hooks/jobs-store';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export default function AdminManageJobs() {
  const { jobs, applications, deleteJob, loadData, isLoading } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteJob = (jobId: string, jobTitle: string) => {
    Alert.alert(
      'Delete Job',
      `Delete "${jobTitle}"? This cannot be undone and will remove all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteJob(jobId);
            if (result.success) {
              Alert.alert('✅ Deleted', 'Job removed successfully.');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete job.');
            }
          }
        }
      ]
    );
  };

  const formatCTC = (ctc: { min: number; max: number }) => {
    if (!ctc) return 'N/A';
    const min = (ctc.min / 100000).toFixed(1);
    const max = (ctc.max / 100000).toFixed(1);
    if (ctc.min === ctc.max) return `₹${min} LPA`;
    return `₹${min} – ₹${max} LPA`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const filtered = jobs.filter(j =>
    !searchQuery ||
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Manage Jobs</Text>
          <Text style={styles.headerSub}>{jobs.length} jobs posted</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          <RefreshCw size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, company, location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Briefcase size={14} color="#6366F1" />
          <Text style={styles.statChipText}>{jobs.length} Total Jobs</Text>
        </View>
        <View style={styles.statChip}>
          <Users size={14} color="#10B981" />
          <Text style={styles.statChipText}>{applications.length} Applications</Text>
        </View>
        <TouchableOpacity
          style={[styles.statChip, styles.addJobChip]}
          onPress={() => router.push('/admin-post-job' as any)}
        >
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.addJobChipText}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* Jobs List */}
      {isLoading || refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Briefcase size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No jobs match your search' : 'No jobs posted yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try a different keyword' : 'Tap "Post Job" to add your first job'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.postFirstJob}
              onPress={() => router.push('/admin-post-job' as any)}
            >
              <Text style={styles.postFirstJobText}>+ Post First Job</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {filtered.map(job => {
            const jobApps = applications.filter(a => a.jobId === job.id);
            const isExpanded = expandedJobId === job.id;

            return (
              <View key={job.id} style={styles.jobCard}>
                {/* Job Header Row */}
                <TouchableOpacity
                  style={styles.jobTop}
                  onPress={() => setExpandedJobId(isExpanded ? null : job.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobIconBox}>
                    <Briefcase size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.jobMainInfo}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.jobCompany}>{job.company}</Text>
                    <View style={styles.jobMeta}>
                      <MapPin size={12} color="#9CA3AF" />
                      <Text style={styles.jobMetaText}>{job.location}</Text>
                    </View>
                  </View>
                  <View style={styles.jobTopRight}>
                    <View style={[styles.statusBadge, job.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                      <Text style={[styles.statusText, job.isActive ? styles.activeText : styles.inactiveText]}>
                        {job.isActive ? 'Active' : 'Closed'}
                      </Text>
                    </View>
                    {isExpanded ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
                  </View>
                </TouchableOpacity>

                {/* Quick stats always visible */}
                <View style={styles.jobQuickStats}>
                  <Text style={styles.ctcText}>{formatCTC(job.ctc)}</Text>
                  <Text style={styles.appsCount}>{jobApps.length} applications</Text>
                  <Text style={styles.postedDate}>Posted {formatDate(job.postedDate)}</Text>
                </View>

                {/* Expanded details */}
                {isExpanded && (
                  <View style={styles.expandedSection}>
                    {job.description ? (
                      <Text style={styles.jobDescription}>{job.description}</Text>
                    ) : null}

                    {job.requirements && job.requirements.length > 0 && (
                      <View style={styles.requirementsBox}>
                        <Text style={styles.detailLabel}>Requirements:</Text>
                        {job.requirements.map((r, i) => (
                          <Text key={i} style={styles.requirementItem}>• {r}</Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>{job.jobType || 'Full-time'}</Text>
                    </View>
                    {job.applicationDeadline && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Deadline:</Text>
                        <Text style={styles.detailValue}>{formatDate(job.applicationDeadline)}</Text>
                      </View>
                    )}

                    {/* Applications list */}
                    {jobApps.length > 0 && (
                      <View style={styles.appsSection}>
                        <Text style={styles.appsSectionTitle}>
                          Applications ({jobApps.length})
                        </Text>
                        {jobApps.slice(0, 5).map(app => (
                          <View key={app.id} style={styles.appRow}>
                            <Text style={styles.appName}>{app.studentName || app.studentId}</Text>
                            <View style={[
                              styles.appStatus,
                              app.status === 'accepted' ? styles.appAccepted :
                              app.status === 'rejected' ? styles.appRejected : styles.appPending
                            ]}>
                              <Text style={styles.appStatusText}>{app.status}</Text>
                            </View>
                          </View>
                        ))}
                        {jobApps.length > 5 && (
                          <Text style={styles.moreApps}>+{jobApps.length - 5} more</Text>
                        )}
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => router.push(`/job/${job.id}` as any)}
                      >
                        <Eye size={16} color="#6366F1" />
                        <Text style={styles.viewBtnText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteJob(job.id, job.title)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 6, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  refreshBtn: { padding: 8 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 16,
    marginTop: 12, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1F2937' },
  clearSearch: { color: '#9CA3AF', fontSize: 16, paddingHorizontal: 4 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F3F4F6', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 20,
  },
  statChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  addJobChip: { backgroundColor: '#6366F1', marginLeft: 'auto' },
  addJobChipText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
  postFirstJob: {
    marginTop: 20, backgroundColor: '#6366F1',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  postFirstJobText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  listContent: { padding: 16, paddingBottom: 40 },

  jobCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  jobTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 14, gap: 12,
  },
  jobIconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  jobMainInfo: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  jobCompany: { fontSize: 13, color: '#6366F1', fontWeight: '500', marginTop: 2 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  jobMetaText: { fontSize: 12, color: '#9CA3AF' },
  jobTopRight: { alignItems: 'flex-end', gap: 6 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  activeBadge: { backgroundColor: '#DCFCE7' },
  inactiveBadge: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 11, fontWeight: '600' },
  activeText: { color: '#16A34A' },
  inactiveText: { color: '#6B7280' },

  jobQuickStats: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12, gap: 12,
  },
  ctcText: { fontSize: 12, color: '#059669', fontWeight: '700' },
  appsCount: { fontSize: 12, color: '#6B7280' },
  postedDate: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },

  expandedSection: {
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    padding: 14, backgroundColor: '#FAFAFA',
  },
  jobDescription: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 10 },
  requirementsBox: { marginBottom: 10 },
  detailRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#374151', minWidth: 70 },
  detailValue: { fontSize: 12, color: '#6B7280', flex: 1 },
  requirementItem: { fontSize: 12, color: '#6B7280', marginLeft: 4, marginTop: 2 },

  appsSection: { marginTop: 12 },
  appsSectionTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  appRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  appName: { fontSize: 13, color: '#374151', flex: 1 },
  appStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  appAccepted: { backgroundColor: '#DCFCE7' },
  appRejected: { backgroundColor: '#FEE2E2' },
  appPending: { backgroundColor: '#FEF3C7' },
  appStatusText: { fontSize: 11, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  moreApps: { fontSize: 12, color: '#6366F1', marginTop: 4, textAlign: 'center' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE',
  },
  viewBtnText: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
});
