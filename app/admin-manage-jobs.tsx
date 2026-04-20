import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft, Search, Briefcase, MapPin, Trash2, Eye,
  Users, Plus, ChevronDown, ChevronUp, RefreshCw, Clock, ExternalLink
} from 'lucide-react-native';
import { useJobs } from '@/hooks/jobs-store';

const { width: screenWidth } = Dimensions.get('window');

export default function AdminManageJobs() {
  const { jobs, applications, deleteJob, loadData, isLoading } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleDeleteJob = (jobId: string, jobTitle: string) => {
    Alert.alert('Delete Placement', `Are you sure you want to remove "${jobTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Permanently',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteJob(jobId);
          if (result.success) Alert.alert('Success', 'Placement removed.');
        }
      }
    ]);
  };

  const filtered = jobs.filter(j =>
    !searchQuery ||
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.isActive).length,
    applications: applications.length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Manage Placements',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Briefcase size={24} color="#6366F1" />
            </View>
            <Text style={styles.headerTitle}>Placement Engine</Text>
            <Text style={styles.headerSubtitle}>Monitor and control active job listings</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>POSTED</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.active}</Text>
              <Text style={styles.statLabel}>ACTIVE</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#6366F1' }]}>{stats.applications}</Text>
              <Text style={styles.statLabel}>APPS</Text>
            </View>
          </View>

          {/* Search Section */}
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <Search size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search placements..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity 
              style={styles.postButton}
              onPress={() => router.push('/admin-post-job' as any)}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.postButtonText}>Post New Opening</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          {isLoading ? (
            <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
          ) : (
            filtered.map(job => {
              const isExpanded = expandedJobId === job.id;
              const jobApps = applications.filter(a => a.jobId === job.id);
              
              return (
                <View key={job.id} style={styles.jobCard}>
                  <TouchableOpacity 
                    style={styles.cardHeader} 
                    onPress={() => setExpandedJobId(isExpanded ? null : job.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.jobBadge}>
                      <Briefcase size={18} color="#6366F1" />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <Text style={styles.jobCompany}>{job.company}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: job.isActive ? '#DCFCE7' : '#F3F4F6' }]}>
                      <Text style={[styles.statusText, { color: job.isActive ? '#166534' : '#6B7280' }]}>
                        {job.isActive ? 'Live' : 'Closed'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.cardOverview}>
                    <View style={styles.overviewItem}>
                      <MapPin size={12} color="#9CA3AF" />
                      <Text style={styles.overviewText}>{job.location}</Text>
                    </View>
                    <View style={styles.overviewItem}>
                      <Users size={12} color="#9CA3AF" />
                      <Text style={styles.overviewText}>{jobApps.length} applicants</Text>
                    </View>
                    <View style={styles.overviewItem}>
                      <Clock size={12} color="#9CA3AF" />
                      <Text style={styles.overviewText}>Posted {new Date(job.postedDate).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.descriptionText} numberOfLines={3}>{job.description}</Text>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity 
                          style={styles.actionBtn}
                          onPress={() => router.push(`/job/${job.id}` as any)}
                        >
                          <ExternalLink size={14} color="#6366F1" />
                          <Text style={styles.actionBtnText}>View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => handleDeleteJob(job.id, job.title)}
                        >
                          <Trash2 size={14} color="#EF4444" />
                          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  backButton: { padding: 8, marginLeft: -8 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF',
    marginHorizontal: -16, marginTop: -16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 20,
  },
  headerIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#6B7280', marginTop: 4 },
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, gap: 10, marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  postButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366F1', paddingVertical: 12, borderRadius: 8,
  },
  postButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  jobCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  jobBadge: { width: 36, height: 36, backgroundColor: '#EEF2FF', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  jobCompany: { fontSize: 12, color: '#6366F1', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardOverview: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  overviewItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  overviewText: { fontSize: 11, color: '#6B7280' },
  expandedContent: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 4 },
  descriptionText: { fontSize: 12, color: '#4B5563', lineHeight: 18, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE',
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#6366F1' },
  deleteBtn: { backgroundColor: '#FFF5F5', borderColor: '#FEE2E2' },
});

