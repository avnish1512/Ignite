import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Dimensions, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft, Search, Users, GraduationCap, 
  RefreshCw, Mail, Phone, Trash2, ShieldCheck, Filter
} from 'lucide-react-native';
import { supabase } from '@/config/supabase';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

type Student = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  year?: string;
  cgpa?: number | string;
  is_active?: boolean;
  profile_completed?: boolean;
  prn_number?: string;
};

const STATUS_FILTERS = ['All', 'Active', 'Inactive'] as const;

export default function AdminManageStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<typeof STATUS_FILTERS[number]>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStudents = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load students.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchStudents(); }, [fetchStudents]));

  const handleToggleStatus = async (student: Student) => {
    const newStatus = !student.is_active;
    try {
      setUpdatingId(student.id);
      const { error } = await supabase.from('students').update({ is_active: newStatus }).eq('id', student.id);
      if (error) throw error;
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_active: newStatus } : s));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
    const matchesFilter = filterStatus === 'All' || (filterStatus === 'Active' && s.is_active !== false) || (filterStatus === 'Inactive' && s.is_active === false);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.is_active !== false).length,
    complete: students.filter(s => s.profile_completed).length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Manage Students',
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchStudents(true)} />}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Users size={24} color="#6366F1" />
            </View>
            <Text style={styles.headerTitle}>Student Roster</Text>
            <Text style={styles.headerSubtitle}>Oversee all registered students and their status</Text>
          </View>

          {/* Stats Summary */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>TOTAL</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.active}</Text>
              <Text style={styles.statLabel}>ACTIVE</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#6366F1' }]}>{stats.complete}</Text>
              <Text style={styles.statLabel}>VERIFIED</Text>
            </View>
          </View>

          {/* Search & Filter */}
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <Search size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.filterContainer}>
              <Filter size={16} color="#6366F1" />
              {STATUS_FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, filterStatus === f && styles.filterChipActive]}
                  onPress={() => setFilterStatus(f)}
                >
                  <Text style={[styles.filterChipText, filterStatus === f && styles.filterChipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* List */}
          {isLoading ? (
            <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
          ) : (
            filteredStudents.map(student => (
              <View key={student.id} style={styles.itemCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.studentName}>{student.name || 'Incomplete'}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: student.is_active !== false ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: student.is_active !== false ? '#166534' : '#991B1B' }]}>
                      {student.is_active !== false ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <GraduationCap size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{student.course || '—'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Phone size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{student.phone || '—'}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, student.is_active !== false ? styles.deactivateBtn : styles.activateBtn]}
                    onPress={() => handleToggleStatus(student)}
                    disabled={updatingId === student.id}
                  >
                    <Text style={[styles.actionButtonText, { color: student.is_active !== false ? '#EF4444' : '#6366F1' }]}>
                      {student.is_active !== false ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => Alert.alert('Details', JSON.stringify(student, null, 2))}
                  >
                    <Text style={styles.actionButtonText}>View Full Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
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
  filterContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#F3F4F6' },
  filterChipActive: { backgroundColor: '#6366F1' },
  filterChipText: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },
  itemCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  studentEmail: { fontSize: 12, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardDetails: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginBottom: 12, gap: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: '#6B7280' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  actionButtonText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  deactivateBtn: { borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
  activateBtn: { borderColor: '#E0E7FF', backgroundColor: '#EEF2FF' },
});