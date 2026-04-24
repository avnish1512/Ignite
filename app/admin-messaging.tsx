import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Send, ArrowLeft, Search, MessageSquare, RefreshCw, User, MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging } from '@/hooks/messaging-store';
import { useNotifications } from '@/hooks/notifications-store';
import { DEFAULT_ADMIN_ID } from '@/constants/admin';

const formatTime = (raw: any): string => {
  const d = raw?.toDate ? raw.toDate() : new Date(raw);
  const diff = Date.now() - d.getTime();
  if (isNaN(diff)) return '';
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};

function AdminChatView({ conversationId, studentName, onBack }: any) {
  const { admin } = useAuth();
  const { conversations, sendMessageAsAdmin, markMessagesAsRead, loadMessages } = useMessaging();
  const { triggerMessageNotification } = useNotifications();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const conversation = conversations.find(c => c.id === conversationId);
  const messages = conversation?.messages || [];

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      markMessagesAsRead(conversationId);
    }
  }, [conversationId]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !admin) return;
    setMessageText('');
    setIsSending(true);
    try {
      await sendMessageAsAdmin(conversationId, admin.id, admin.name || 'Admin', text);
      if (conversation?.studentId) triggerMessageNotification(conversation.studentId, admin.name || 'Admin');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{studentName}</Text>
          <Text style={styles.headerStatus}>Student Account</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <MoreHorizontal size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg: any) => {
          const isAdmin = msg.senderRole === 'admin';
          return (
            <View key={msg.id} style={[styles.bubbleWrapper, isAdmin ? styles.myWrapper : styles.theirWrapper]}>
              <View style={[styles.bubble, isAdmin ? styles.adminBubble : styles.studentBubble]}>
                <Text style={[styles.bubbleText, isAdmin && { color: '#FFF' }]}>{msg.text}</Text>
                <Text style={[styles.bubbleTime, isAdmin && { color: '#C7D2FE' }]}>{formatTime(msg.timestamp)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Reply to student..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !messageText.trim() && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!messageText.trim() || isSending}
        >
          {isSending ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function AdminMessagingScreen() {
  const { admin } = useAuth();
  const { conversations, getAdminConversations } = useMessaging();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // ── Check admin role ─────────────────────────────────────
  if (!admin) {
    useEffect(() => {
      router.replace('/' as any);
    }, []);
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (admin) {
      getAdminConversations(DEFAULT_ADMIN_ID);
      setIsLoading(false);
    }
  }, [admin]);

  if (selectedConvId) {
    return (
      <SafeAreaView style={styles.container}>
        <AdminChatView 
          conversationId={selectedConvId} 
          studentName={selectedName} 
          onBack={() => setSelectedConvId(null)} 
        />
      </SafeAreaView>
    );
  }

  const filtered = conversations.filter(c => 
    !searchText || (c.studentName || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Student Queries',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MessageSquare size={24} color="#6366F1" />
            </View>
            <Text style={styles.headerTitle}>Inbox</Text>
            <Text style={styles.headerSubtitle}>Respond to student questions and applications</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <Search size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
          ) : (
            filtered.map(conv => (
              <TouchableOpacity
                key={conv.id}
                style={styles.convCard}
                onPress={() => {
                  setSelectedConvId(conv.id);
                  setSelectedName(conv.studentName || 'Student');
                }}
              >
                <View style={styles.avatar}>
                  <User size={20} color="#6366F1" />
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convTop}>
                    <Text style={styles.convName}>{conv.studentName || 'Student'}</Text>
                    <Text style={styles.convTime}>{formatTime(conv.lastMessageTime)}</Text>
                  </View>
                  <Text style={styles.convLast} numberOfLines={1}>{conv.lastMessage || 'No messages'}</Text>
                </View>
                {conv.unreadCount > 0 && <View style={styles.unreadBadge} />}
              </TouchableOpacity>
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
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, gap: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  convCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  convInfo: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  convTime: { fontSize: 11, color: '#9CA3AF' },
  convLast: { fontSize: 13, color: '#6B7280' },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', marginLeft: 10 },
  
  // Chat View
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerInfo: { flex: 1, marginLeft: 8 },
  headerName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  headerStatus: { fontSize: 11, color: '#10B981', fontWeight: '500' },
  headerAction: { padding: 8 },
  messagesList: { flex: 1 },
  bubbleWrapper: { marginBottom: 12, flexDirection: 'row' },
  myWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  adminBubble: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  studentBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleText: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  textInput: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' },
});
