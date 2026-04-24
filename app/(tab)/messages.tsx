import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft, MessageSquare, Users, Plus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useMessaging, Conversation } from '@/hooks/messaging-store';
import { useTheme } from '@/hooks/theme-store';
import { capitalizeWords, getInitials } from '@/hooks/text-utils';
import { MessageSkeleton } from '@/components/SkeletonLoader';
import { DEFAULT_ADMIN_ID } from '@/constants/admin';

const formatTime = (date: any): string => {
  if (!date) return '';
  const d = date?.toDate?.() ?? new Date(date);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ── Chat View Component ──────────────────────────────────────────
function ChatView({
  conversationId,
  onBack,
  chatTitle,
  chatEmoji,
  isPeer,
  peerId,
  profileImageUrl,
}: {
  conversationId: string;
  onBack: () => void;
  chatTitle: string;
  chatEmoji: string;
  isPeer: boolean;
  peerId?: string;
  profileImageUrl?: string;
}) {
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const { student } = useAuth();
  const { conversations, sendMessageAsStudent, sendPeerMessage, markMessagesAsRead } = useMessaging();
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
      if (isPeer && peerId) {
        // P2P message
        await sendPeerMessage(conversationId, student.id, student.name || 'Student', peerId, text);
        // Optional: notify peer (though notifications might be student-only right now)
      } else {
        // Admin message
        await sendMessageAsStudent(student.id, student.name || 'Student', text, DEFAULT_ADMIN_ID);
        // Note: Admin notifications might be handled differently, but let's be consistent
      }
      console.log('✅ Message handled in UI');
    } catch (err) {
      console.error('❌ Message send error in UI:', err);
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
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.chatHeaderAvatar, !profileImageUrl && isPeer && { backgroundColor: getAvatarColor(chatTitle) }]}>
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.chatHeaderAvatarImage}
            />
          ) : isPeer ? (
            <Text style={styles.chatHeaderInitials}>{getInitials(chatTitle)}</Text>
          ) : (
            <Text style={styles.chatHeaderAvatarText}>{chatEmoji}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderTitle}>{capitalizeWords(chatTitle)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1, gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.success }} />
            <Text style={{ fontSize: 11, color: theme.success, fontWeight: '600' }}>
              {isPeer ? 'Student' : 'Admin'}
            </Text>
          </View>
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
            <MessageSquare size={40} color={theme.textMuted} />
            <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
            <Text style={styles.emptyMessagesSubtitle}>
              {isPeer ? 'Start a conversation!' : 'Send a message to the admin'}
            </Text>
          </View>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.senderId === student?.id;
            return (
              <View key={msg.id} style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  {/* Show sender name in peer chats for their messages */}
                  {isPeer && !isMe && (
                    <Text style={styles.senderLabel}>{capitalizeWords(msg.senderName)}</Text>
                  )}
                  <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.theirBubbleText]}>
                    {msg.text}
                  </Text>
                  <View style={[styles.timeAndReadContainer, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.bubbleTime, isMe ? styles.myBubbleTime : styles.theirBubbleTime]}>
                      {formatTime(msg.timestamp)}
                    </Text>
                    {isMe && (
                      <Text style={[styles.readReceipt, msg.read ? styles.readReceiptRead : styles.readReceiptSent]}>
                        {msg.read ? '✓✓' : '✓'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={[styles.textInput, { maxHeight: 100 }]}
          placeholder="Type your message..."
          placeholderTextColor={theme.textMuted}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          returnKeyType="send"
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

// ── Avatar color helper ────────────────────────────────────────
function getAvatarColor(name: string) {
  const colors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#10B981', '#3B82F6', '#14B8A6', '#F97316', '#06B6D4',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ── Main Messages Screen ─────────────────────────────────────────
export default function MessagesScreen() {
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const { student } = useAuth();
  const { conversations, getStudentConversation, loadStudentConversations } = useMessaging();
  const { conversationId, senderName } = useLocalSearchParams<{ conversationId?: string; senderName?: string }>();
  const [activeConversation, setActiveConversation] = useState<{
    id: string;
    title: string;
    emoji: string;
    isPeer: boolean;
    peerId?: string;
    profileImageUrl?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load ALL conversations for this student (admin + peer)
  useEffect(() => {
    if (!student?.id) { setIsLoading(false); return; }
    
    // First ensure admin conversation exists with CORRECT name
    getStudentConversation(student.id, DEFAULT_ADMIN_ID, student.name)
      .then(() => {
        // Then load all conversations via real-time listener
        return loadStudentConversations(student.id);
      })
      .catch(err => console.error('Error loading conversations:', err))
      .finally(() => setIsLoading(false));
  }, [student?.id, student?.name]);

  // Sort conversations: admin first, then by last message time
  const sortedConversations = React.useMemo(() => {
    if (!student?.id) return [];
    return [...conversations].sort((a, b) => {
      // Admin always first
      const aIsAdmin = a.type !== 'peer';
      const bIsAdmin = b.type !== 'peer';
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      // Then by time
      const timeA = a.lastMessageTime instanceof Date ? a.lastMessageTime.getTime() : 0;
      const timeB = b.lastMessageTime instanceof Date ? b.lastMessageTime.getTime() : 0;
      return timeB - timeA;
    });
  }, [conversations, student?.id]);

  // Handle opening conversation from notification/params
  useEffect(() => {
    if (conversationId) {
      const openConv = () => {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
          const isPeer = (conv.adminId !== 'admin' && conv.adminId !== 'ADMIN_ID');
          const title = isPeer ? (conv.peerName || conv.adminName || 'Student') : 'Placement Admin';
          const emoji = isPeer ? '' : '👨‍💼';
          
          setActiveConversation({
            id: conv.id,
            title,
            emoji,
            isPeer,
            peerId: conv.peerId,
            profileImageUrl: isPeer ? conv.peerProfileImageUrl : undefined
          });
        }
      };

      if (conversations.length > 0) {
        openConv();
      }
    }
  }, [conversationId, conversations.length > 0]);

  // Keep activeConversation title and profile image in sync if conversation updates in the background
  useEffect(() => {
    if (activeConversation) {
      const conv = conversations.find(c => c.id === activeConversation.id);
      if (conv) {
        const isPeer = conv.type === 'peer';
        const newTitle = isPeer ? (conv.peerName || 'Student') : 'Placement Admin';
        const newProfileImage = isPeer ? conv.peerProfileImageUrl : undefined;
        
        if (activeConversation.title !== newTitle || activeConversation.profileImageUrl !== newProfileImage) {
          setActiveConversation(prev => prev ? {
            ...prev,
            title: newTitle,
            profileImageUrl: newProfileImage
          } : null);
        }
      }
    }
  }, [conversations, activeConversation]);

  // ── Showing chat view ─────────────────────────────────────
  if (activeConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatView
          conversationId={activeConversation.id}
          onBack={() => setActiveConversation(null)}
          chatTitle={activeConversation.title}
          chatEmoji={activeConversation.emoji}
          isPeer={activeConversation.isPeer}
          peerId={activeConversation.peerId}
          profileImageUrl={activeConversation.profileImageUrl}
        />
      </SafeAreaView>
    );
  }

  // ── Helper: get display info for a conversation ─────────────
  const getConvDisplay = (conv: Conversation) => {
    const isPeer = (conv.adminId !== 'admin' && conv.adminId !== 'ADMIN_ID');
    if (isPeer) {
      // Find the other person's name - prefer peerName
      const otherName = conv.peerName || conv.adminName || 'Student';
      return {
        name: capitalizeWords(otherName),
        emoji: '',
        initials: getInitials(otherName),
        color: getAvatarColor(otherName),
        subtitle: 'Student',
        isPeer: true,
        peerId: conv.peerId,
      };
    }
    return {
      name: 'Placement Admin',
      emoji: '👨‍💼',
      initials: '',
      color: '',
      subtitle: 'Admin',
      isPeer: false,
      peerId: undefined,
    };
  };

  // ── Conversation list / loading ───────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.directoryBtn}
          onPress={() => router.push('/student-directory' as any)}
        >
          <Users size={18} color={theme.primary} />
          <Text style={styles.directoryBtnText}>Students</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <MessageSkeleton />
      ) : !student ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Please log in</Text>
        </View>
      ) : sortedConversations.length > 0 ? (
        <FlatList
          data={sortedConversations}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: conv }) => {
            const display = getConvDisplay(conv);
            const unreadCount = conv.messages?.filter(
              (m: any) => !m.read && m.senderId !== student.id
            ).length || 0;

            return (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => setActiveConversation({
                  id: conv.id,
                  title: display.isPeer ? (conv.peerName || conv.adminName) : 'Placement Admin',
                  emoji: display.emoji,
                  isPeer: display.isPeer,
                  peerId: display.peerId,
                })}
                activeOpacity={0.7}
              >
                <View style={styles.convAvatar}>
                  {display.isPeer ? (
                    <View style={[styles.peerAvatarCircle, { backgroundColor: display.color }]}>
                      <Text style={styles.peerAvatarInitials}>{display.initials}</Text>
                    </View>
                  ) : (
                    <Text style={styles.convAvatarText}>👨‍💼</Text>
                  )}
                  <View style={[
                    styles.onlineDot,
                    !display.isPeer && { backgroundColor: theme.success },
                    display.isPeer && { backgroundColor: theme.textMuted },
                  ]} />
                </View>
                <View style={styles.convBody}>
                  <View style={styles.convHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={styles.convName} numberOfLines={1}>{display.name}</Text>
                      {!display.isPeer && (
                        <View style={styles.adminTag}>
                          <Text style={styles.adminTagText}>ADMIN</Text>
                        </View>
                      )}
                      {display.isPeer && (
                        <View style={styles.peerTag}>
                          <Text style={styles.peerTagText}>PEER</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.convTime}>{formatTime(conv.lastMessageTime)}</Text>
                  </View>
                  <View style={styles.convFooter}>
                    <Text style={styles.convLastMsg} numberOfLines={1}>
                      {conv.lastMessage || 'Start a conversation'}
                    </Text>
                    {unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={styles.centered}>
          <MessageSquare size={52} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Message the admin or find students to chat with
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={async () => {
                if (!student) return;
                setIsLoading(true);
                const conv = await getStudentConversation(student.id, DEFAULT_ADMIN_ID, student.name);
                if (conv?.id) {
                  setActiveConversation({
                    id: conv.id,
                    title: 'Placement Admin',
                    emoji: '👨‍💼',
                    isPeer: false,
                  });
                }
                setIsLoading(false);
              }}
            >
              <Text style={styles.startBtnText}>Message Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startBtn, styles.secondaryBtn]}
              onPress={() => router.push('/student-directory' as any)}
            >
              <Users size={16} color={theme.primary} />
              <Text style={[styles.startBtnText, { color: theme.primary }]}>Find Students</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FAB — New conversation */}
      {sortedConversations.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/student-directory' as any)}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: theme.text },
    directoryBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: theme.primaryLight, paddingHorizontal: 12,
      paddingVertical: 6, borderRadius: 20,
    },
    directoryBtnText: {
      fontSize: 13, fontWeight: '600', color: theme.primary,
    },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText: { marginTop: 10, color: theme.textMuted, fontSize: 14 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.text, marginTop: 14, textAlign: 'center' },
    emptySubtitle: { fontSize: 13, color: theme.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    emptyActions: { marginTop: 20, gap: 10, alignItems: 'center' },
    startBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: theme.primary,
      paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
    },
    startBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
    secondaryBtn: {
      backgroundColor: theme.primaryLight,
      borderWidth: 1, borderColor: theme.primary,
    },

    // Conversation list item
    convItem: {
      flexDirection: 'row', alignItems: 'center', padding: 16,
      backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    convAvatar: { position: 'relative', marginRight: 12 },
    convAvatarText: {
      width: 50, height: 50, borderRadius: 25, backgroundColor: theme.primaryLight,
      fontSize: 26, textAlign: 'center', lineHeight: 50,
    },
    peerAvatarCircle: {
      width: 50, height: 50, borderRadius: 25,
      alignItems: 'center', justifyContent: 'center',
    },
    peerAvatarInitials: {
      color: '#FFFFFF', fontSize: 18, fontWeight: '700',
    },
    onlineDot: {
      position: 'absolute', bottom: 1, right: 1,
      width: 12, height: 12, borderRadius: 6,
      backgroundColor: theme.success, borderWidth: 2, borderColor: theme.surface,
    },
    convBody: { flex: 1 },
    convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    convName: { fontSize: 15, fontWeight: '700', color: theme.text, flexShrink: 1 },
    adminTag: {
      backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    adminTagText: { fontSize: 9, fontWeight: '800', color: '#3B82F6', letterSpacing: 0.5 },
    peerTag: {
      backgroundColor: '#E0E7FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    peerTagText: { fontSize: 9, fontWeight: '800', color: '#6366F1', letterSpacing: 0.5 },
    convTime: { fontSize: 12, color: theme.textMuted },
    convFooter: { flexDirection: 'row', alignItems: 'center' },
    convLastMsg: { fontSize: 13, color: theme.textSecondary, flex: 1, marginRight: 6 },
    badge: {
      backgroundColor: theme.primary, borderRadius: 10,
      minWidth: 20, height: 20, justifyContent: 'center',
      alignItems: 'center', paddingHorizontal: 5,
    },
    badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

    // FAB
    fab: {
      position: 'absolute', bottom: 20, right: 20,
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },

    // Chat view
    chatContainer: { flex: 1, backgroundColor: theme.background },
    chatHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    backButton: { padding: 4 },
    chatHeaderAvatar: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center',
    },
    chatHeaderAvatarText: { fontSize: 20 },
    chatHeaderAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 19,
    },
    chatHeaderInitials: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    chatHeaderTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
    chatHeaderSubtitle: { fontSize: 11, color: theme.textMuted, marginTop: 1 },

    messagesContainer: { flex: 1, paddingHorizontal: 14 },
    emptyMessages: { flex: 1, alignItems: 'center', paddingTop: 80 },
    emptyMessagesTitle: { fontSize: 16, fontWeight: '700', color: theme.textMuted, marginTop: 14 },
    emptyMessagesSubtitle: { fontSize: 13, color: theme.textMuted, marginTop: 6 },

    senderLabel: {
      fontSize: 11, fontWeight: '700', color: theme.primary, marginBottom: 3,
    },
    messageRow: { marginVertical: 3, flexDirection: 'row' },
    myRow: { justifyContent: 'flex-end' },
    theirRow: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '78%', paddingHorizontal: 14,
      paddingTop: 8, paddingBottom: 6, borderRadius: 16,
    },
    myBubble: { backgroundColor: theme.primary, borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: theme.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.borderStrong },
    bubbleText: { fontSize: 15, lineHeight: 20 },
    myBubbleText: { color: '#FFFFFF' },
    theirBubbleText: { color: theme.text },
    timeAndReadContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
    bubbleTime: { fontSize: 10 },
    myBubbleTime: { color: 'rgba(255, 255, 255, 0.7)', textAlign: 'right' },
    theirBubbleTime: { color: theme.textMuted },
    readReceipt: { fontSize: 10, alignSelf: 'flex-end' },
    readReceiptSent: { color: 'rgba(255, 255, 255, 0.7)' },
    readReceiptRead: { color: '#60A5FA', fontWeight: 'bold' },

    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border,
    },
    textInput: {
      flex: 1, backgroundColor: theme.surfaceAlt, borderRadius: 20,
      paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 14, color: theme.text, maxHeight: 100,
    },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: theme.borderStrong },
  });
}