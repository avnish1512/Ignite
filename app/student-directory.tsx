import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Search, MessageCircle, ArrowLeft, Users } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging } from '@/hooks/messaging-store';
import { useTheme } from '@/hooks/theme-store';
import { capitalizeWords, getInitials } from '@/hooks/text-utils';
import { supabase } from '@/config/supabase';

interface StudentItem {
  id: string;
  name: string;
  email: string;
  course: string;
  year: string;
  profileImageUrl?: string;
}

export default function StudentDirectoryScreen() {
  const { student } = useAuth();
  const { getOrCreatePeerConversation } = useMessaging();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [creatingConvFor, setCreatingConvFor] = useState<string | null>(null);

  // Fetch all students from Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, name, email, course, year, profile_image_url');

        if (error) throw error;
        
        const allStudents = (data || [])
          .map(doc => ({
            id: doc.id,
            name: doc.name || 'Unknown',
            email: doc.email || '',
            course: doc.course || '',
            year: doc.year || '',
            profileImageUrl: doc.profile_image_url || undefined,
          }))
          // Filter out the current student
          .filter(s => s.id !== student?.id);

        setStudents(allStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [student?.id]);

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Handle starting a conversation with a peer
  const handleMessage = useCallback(async (peer: StudentItem) => {
    if (!student) return;
    setCreatingConvFor(peer.id);
    try {
      const conv = await getOrCreatePeerConversation(
        student.id,
        student.name,
        peer.id,
        peer.name
      );
      if (conv) {
        // Navigate directly to the chat
        router.push({
          pathname: '/(tab)/messages' as any,
          params: { 
            conversationId: conv.id,
            senderName: peer.name
          }
        });
      }
    } catch (error) {
      console.error('Error creating peer conversation:', error);
    } finally {
      setCreatingConvFor(null);
    }
  }, [student, getOrCreatePeerConversation]);

  // Avatar background colors based on name hash
  const getAvatarColor = (name: string) => {
    const colors = [
      '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
      '#10B981', '#3B82F6', '#14B8A6', '#F97316', '#06B6D4',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const renderStudent = ({ item }: { item: StudentItem }) => (
    <View style={styles.studentCard}>
      <View style={[styles.avatar, !item.profileImageUrl && { backgroundColor: getAvatarColor(item.name) }]}>
        {item.profileImageUrl ? (
          <Image
            source={{ uri: item.profileImageUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        )}
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{capitalizeWords(item.name)}</Text>
        <Text style={styles.studentMeta}>
          {item.course}{item.year ? ` • ${item.year}` : ''}
        </Text>
        <Text style={styles.studentEmail} numberOfLines={1}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.messageBtn, creatingConvFor === item.id && styles.messageBtnLoading]}
        onPress={() => handleMessage(item)}
        disabled={creatingConvFor === item.id}
      >
        <MessageCircle size={18} color="#FFFFFF" />
        <Text style={styles.messageBtnText}>
          {creatingConvFor === item.id ? '...' : 'Chat'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Student Directory</Text>
          <Text style={styles.headerSub}>{students.length} students</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color={theme.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, course..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Student List */}
      {isLoading ? (
        <View style={styles.centered}>
          <Users size={48} color={theme.textMuted} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.centered}>
          <Users size={48} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No students match your search' : 'No other students found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try a different keyword' : 'Students will appear here once they register'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={item => item.id}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      padding: 6,
      marginRight: 10,
    },
    headerCenter: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    headerSub: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 1,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceAlt,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.borderStrong,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: theme.text,
    },
    clearSearch: {
      color: theme.textMuted,
      fontSize: 16,
      paddingHorizontal: 4,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    loadingText: {
      marginTop: 12,
      color: theme.textMuted,
      fontSize: 14,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 6,
      textAlign: 'center',
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    studentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.borderStrong,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    studentMeta: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '500',
      marginTop: 2,
    },
    studentEmail: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    messageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    messageBtnLoading: {
      opacity: 0.6,
    },
    messageBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
