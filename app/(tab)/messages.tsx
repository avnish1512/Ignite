import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging } from '@/hooks/messaging-store';
import { DEFAULT_ADMIN_ID } from '@/constants/admin';

const formatTime = (date: any): string => {
  if (!date) return '';
  let d: Date;
  if (typeof date?.toDate === 'function') d = date.toDate();
  else if (date instanceof Date) d = date;
  else if (typeof date?.seconds === 'number') d = new Date(date.seconds * 1000);
  else d = new Date(date);
  const diff = Date.now() - d.getTime();
  if (isNaN(diff)) return '';
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};

function ChatView({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { student } = useAuth();
  const { conversations, sendMessageAsStudent, markMessagesAsRead } = useMessaging();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Always get the freshest conversation from the store
  const conversation = conversations.find(c => c.id === conversationId);
  const messages = conversation?.messages || [];

  useEffect(() => {
    if (conversationId) markMessagesAsRead(conversationId);
  }, [conversationId, markMessagesAsRead]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !student) return;
    setMessageText('');
    setIsSending(true);
    try {
      await sendMessageAsStudent(student.id, student.name || 'Student', text, DEFAULT_ADMIN_ID);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.chatContainer}
    >
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.chatHeaderAvatar}>
          <Text style={styles.chatHeaderAvatarText}>👨‍💼</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderTitle}>Placement Admin</Text>
          <Text style={styles.chatHeaderSubtitle}>Ignite Placement Cell</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingVertical: 12 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyMessages}>
            <MessageSquare size={40} color="#D1D5DB" />
            <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
            <Text style={styles.emptyMessagesSubtitle}>Start a conversation with the admin</Text>
          </View>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.senderRole === 'student';
            return (
              <View key={msg.id} style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.theirBubbleText]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.bubbleTime, isMe ? styles.myBubbleTime : styles.theirBubbleTime]}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxHeight={100}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!messageText.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || isSending}
        >
          {isSending
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Send size={18} color="#FFFFFF" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function MessagesScreen() {
  const { student } = useAuth();
  const { conversations, getStudentConversation } = useMessaging();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load/create conversation on mount
  useEffect(() => {
    if (!student?.id) { setIsLoading(false); return; }
    getStudentConversation(student.id)
      .then(conv => { if (conv?.id) setConversationId(conv.id); })
      .catch(err => console.error('Error loading conversation:', err))
      .finally(() => setIsLoading(false));
  }, [student?.id]);

  // Get the current conversation from live store
  const conversation = conversationId
    ? conversations.find(c => c.id === conversationId) ?? null
    : null;

  // ── Showing chat view ─────────────────────────────────────
  if (conversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatView
          conversationId={conversationId}
          onBack={() => setConversationId(null)}
        />
      </SafeAreaView>
    );
  }

  // ── Conversation list / loading ───────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : !student ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Please log in</Text>
        </View>
      ) : conversation ? (
        <TouchableOpacity
          style={styles.convItem}
          onPress={() => setConversationId(conversation.id)}
          activeOpacity={0.7}
        >
          <View style={styles.convAvatar}>
            <Text style={styles.convAvatarText}>👨‍💼</Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.convBody}>
            <View style={styles.convHeader}>
              <Text style={styles.convName}>{conversation.adminName || 'Admin'}</Text>
              <Text style={styles.convTime}>{formatTime(conversation.lastMessageTime)}</Text>
            </View>
            <View style={styles.convFooter}>
              <Text style={styles.convLastMsg} numberOfLines={1}>
                {conversation.lastMessage || 'Start a conversation'}
              </Text>
              {(conversation.unreadCount ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.centered}>
          <MessageSquare size={52} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the button below to message the admin
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={async () => {
              if (!student) return;
              setIsLoading(true);
              const conv = await getStudentConversation(student.id);
              if (conv?.id) setConversationId(conv.id);
              setIsLoading(false);
            }}
          >
            <Text style={styles.startBtnText}>Message Admin</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 10, color: '#9CA3AF', fontSize: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 14, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  startBtn: {
    marginTop: 20, backgroundColor: '#6366F1',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  startBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Conversation list item
  convItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  convAvatar: { position: 'relative', marginRight: 12 },
  convAvatarText: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEF2FF',
    fontSize: 26, textAlign: 'center', lineHeight: 50,
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFFFF',
  },
  convBody: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  convTime: { fontSize: 12, color: '#9CA3AF' },
  convFooter: { flexDirection: 'row', alignItems: 'center' },
  convLastMsg: { fontSize: 13, color: '#6B7280', flex: 1, marginRight: 6 },
  badge: {
    backgroundColor: '#6366F1', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Chat view
  chatContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 4 },
  chatHeaderAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  chatHeaderAvatarText: { fontSize: 20 },
  chatHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  chatHeaderSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },

  messagesContainer: { flex: 1, paddingHorizontal: 14 },
  emptyMessages: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyMessagesTitle: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginTop: 14 },
  emptyMessagesSubtitle: { fontSize: 13, color: '#C4C4C4', marginTop: 6 },

  messageRow: { marginVertical: 3, flexDirection: 'row' },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%', paddingHorizontal: 14,
    paddingTop: 8, paddingBottom: 6, borderRadius: 16,
  },
  myBubble: { backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  myBubbleText: { color: '#FFFFFF' },
  theirBubbleText: { color: '#1F2937' },
  bubbleTime: { fontSize: 10, marginTop: 3 },
  myBubbleTime: { color: '#C7D2FE', textAlign: 'right' },
  theirBubbleTime: { color: '#9CA3AF' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  textInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#1F2937', maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
});