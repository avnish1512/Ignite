import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/config/supabase';
import { DEFAULT_ADMIN_ID } from '@/constants/admin';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'student';
  recipientId: string;
  text: string;
  timestamp: any;
  read: boolean;
}

export interface Conversation {
  id: string;
  studentId: string;
  studentName: string;
  adminId: string;
  adminName: string;
  messages: Message[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  // P2P fields
  type?: 'admin' | 'peer';
  peerId?: string;
  peerName?: string;
  participants?: string[];
}

export const [MessagingProvider, useMessaging] = createContextHook(() => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversation] = useState<string | null>(null);
  const channelRefs = useRef<{ [key: string]: RealtimeChannel }>({});
  const parentChannelRef = useRef<RealtimeChannel | null>(null);

  // Generate conversation ID (consistent between two users)
  const getConversationId = useCallback((userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  }, []);

  // Real-time listener for messages in a conversation using Supabase
  const setupMessageListener = useCallback((conversationId: string) => {
    try {
      // Unsubscribe from previous listener if exists
      if (channelRefs.current[conversationId]) {
        supabase.removeChannel(channelRefs.current[conversationId]);
      }

      // Subscribe to real-time changes
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            // Fetch updated messages when changes occur
            const { data, error } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversationId)
              .order('timestamp', { ascending: true });

            if (!error && data) {
              const loadedMessages = data.map((msg: any) => ({
                id: msg.id,
                senderId: msg.sender_id,
                senderName: msg.sender_name,
                senderRole: msg.sender_role,
                recipientId: msg.recipient_id,
                text: msg.text,
                timestamp: msg.timestamp,
                read: msg.read
              })) as Message[];

              // Update conversation messages in real-time
              setConversations(prev =>
                prev.map(conv =>
                  conv.id === conversationId
                    ? { ...conv, messages: loadedMessages }
                    : conv
                )
              );
            }
          }
        )
        .subscribe();

      channelRefs.current[conversationId] = channel;
      return () => {
        supabase.removeChannel(channel);
        delete channelRefs.current[conversationId];
      };
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return () => {};
    }
  }, []);

  // Send message as student
  const sendMessageAsStudent = useCallback(async (
    studentId: string,
    studentName: string,
    text: string,
    adminId?: string
  ) => {
    try {
      const finalAdminId = adminId || DEFAULT_ADMIN_ID;
      const conversationId = getConversationId(studentId, finalAdminId);

      // Ensure listener is set up
      setupMessageListener(conversationId);

      // Create or ensure conversation exists
      const { data: convData } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!convData) {
        await supabase.from('conversations').insert({
          id: conversationId,
          student_id: studentId,
          student_name: studentName,
          admin_id: finalAdminId,
          admin_name: 'Admin',
          participants: [studentId, finalAdminId],
          last_message: text,
          last_message_time: new Date().toISOString()
        });
      }

      // Add message
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: studentId,
        sender_name: studentName,
        sender_role: 'student',
        recipient_id: finalAdminId,
        text,
        timestamp: new Date().toISOString(),
        read: false
      });

      if (msgError) {
        console.error('Error inserting message:', msgError);
        return;
      }

      // Update conversation metadata
      await supabase.from('conversations')
        .update({
          last_message: text,
          last_message_time: new Date().toISOString()
        })
        .eq('id', conversationId);

      console.log('✅ Message sent:', { conversationId, studentId, text });
    } catch (error) {
      console.error('Error sending message as student:', error);
    }
  }, [getConversationId, setupMessageListener]);

  // Send message as admin
  const sendMessageAsAdmin = useCallback(async (
    conversationId: string,
    adminId: string,
    adminName: string,
    text: string
  ) => {
    try {
      const parts = conversationId.split('_');
      const studentId = parts[0] === adminId ? parts[1] : parts[0];

      // Add message
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: adminId,
        sender_name: adminName,
        sender_role: 'admin',
        recipient_id: studentId,
        text,
        timestamp: new Date().toISOString(),
        read: false
      });

      if (msgError) {
        console.error('Error inserting message:', msgError);
        return;
      }

      // Update conversation metadata
      await supabase.from('conversations')
        .update({
          last_message: text,
          last_message_time: new Date().toISOString()
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error sending message as admin:', error);
    }
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Get student conversation
  const getStudentConversation = useCallback(async (studentId: string, adminId?: string, studentName?: string) => {
    try {
      const finalAdminId = adminId || DEFAULT_ADMIN_ID;
      const conversationId = getConversationId(studentId, finalAdminId);

      // Check if already in state
      const existingConv = conversations.find(c => c.id === conversationId);
      if (existingConv) {
        if (!existingConv.messages || existingConv.messages.length === 0) {
          setupMessageListener(conversationId);
        }
        return existingConv;
      }

      // Fetch from database
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      let conversation: any = convData;

      if (!conversation) {
        console.log('🆕 Creating new conversation for:', studentName || 'Student');
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            id: conversationId,
            student_id: studentId,
            student_name: studentName || 'Student',
            admin_id: finalAdminId,
            admin_name: 'Admin',
            participants: [studentId, finalAdminId],
            last_message: 'No messages yet',
            last_message_time: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating conversation:', createError);
          // Try to refetch in case it was created concurrently
          const { data: retryData } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .maybeSingle();
          conversation = retryData;
        } else {
          conversation = newConv;
        }
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      const messages = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderRole: msg.sender_role,
        recipientId: msg.recipient_id,
        text: msg.text,
        timestamp: msg.timestamp,
        read: msg.read
      })) as Message[];

      const conversationObj: Conversation = {
        id: conversationId,
        studentId: conversation.student_id || studentId,
        studentName: conversation.student_name || 'Student',
        adminId: conversation.admin_id || finalAdminId,
        adminName: conversation.admin_name || 'Admin',
        messages,
        lastMessage: conversation.last_message || 'No messages yet',
        lastMessageTime: new Date(conversation.last_message_time || Date.now()),
        unreadCount: messages.filter(m => !m.read && m.recipientId === studentId).length
      };

      setConversations(prev => {
        const exists = prev.find(c => c.id === conversationId);
        if (exists) return prev;
        return [...prev, conversationObj];
      });

      setupMessageListener(conversationId);
      return conversationObj;
    } catch (error) {
      console.error('Error getting student conversation:', error);
      return null;
    }
  }, [getConversationId, setupMessageListener, conversations]);

  // Get admin conversations with real-time updates
  const getAdminConversations = useCallback(async (adminId: string) => {
    try {
      const channel = supabase
        .channel(`conversations:admin:${adminId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `admin_id=eq.${adminId}`
          },
          async () => {
            // Refetch conversations when changes occur
            const { data } = await supabase
              .from('conversations')
              .select('*')
              .eq('admin_id', adminId)
              .order('last_message_time', { ascending: false });

            if (data) {
              // Fetch messages for each conversation and set up listeners
              const convsWithMessages = await Promise.all(data.map(async (c) => {
                const { data: msgData } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('conversation_id', c.id)
                  .order('timestamp', { ascending: true });

                const messages = (msgData || []).map((msg: any) => ({
                  id: msg.id,
                  senderId: msg.sender_id,
                  senderName: msg.sender_name,
                  senderRole: msg.sender_role,
                  recipientId: msg.recipient_id,
                  text: msg.text,
                  timestamp: msg.timestamp,
                  read: msg.read
                })) as Message[];

                setupMessageListener(c.id);
                
                return {
                  id: c.id,
                  studentId: c.student_id,
                  studentName: c.student_name,
                  adminId: c.admin_id,
                  adminName: c.admin_name,
                  messages,
                  lastMessage: c.last_message || '',
                  lastMessageTime: new Date(c.last_message_time || Date.now()),
                  unreadCount: messages.filter(m => !m.read && m.senderRole === 'student').length,
                  participants: c.participants,
                  type: c.admin_id === 'admin' ? 'admin' : 'peer' // Corrected inference
                } as Conversation;
              }));

              setConversations(convsWithMessages);
            }
          }
        )
        .subscribe();

      parentChannelRef.current = channel;

      // Initial fetch: find any conversation where admin is a participant
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .or(`admin_id.eq.${adminId},participants.cs.{${adminId}}`)
        .order('last_message_time', { ascending: false });

      if (data) {
        // Fetch messages for each conversation
        const convsWithMessages = await Promise.all(data.map(async (c) => {
          const { data: msgData } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.id)
            .order('timestamp', { ascending: true });

          const messages = (msgData || []).map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            senderRole: msg.sender_role,
            recipientId: msg.recipient_id,
            text: msg.text,
            timestamp: msg.timestamp,
            read: msg.read
          })) as Message[];

          setupMessageListener(c.id);
          
          return {
            id: c.id,
            studentId: c.student_id,
            studentName: c.student_name,
            adminId: c.admin_id,
            adminName: c.admin_name,
            messages,
            lastMessage: c.last_message || '',
            lastMessageTime: new Date(c.last_message_time || Date.now()),
            unreadCount: messages.filter(m => !m.read && m.senderRole === 'student').length,
            participants: c.participants
          } as Conversation;
        }));

        setConversations(convsWithMessages);
      }

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error getting admin conversations:', error);
      return () => {};
    }
  }, [setupMessageListener]);

  // Get specific conversation for admin
  const getStudentSpecificConversation = useCallback((adminId: string, studentId: string) => {
    return conversations.find(c => c.studentId === studentId && c.adminId === adminId) || null;
  }, [conversations]);

  // Get students list for admin
  const getStudentsForAdmin = useCallback((adminId: string) => {
    return conversations
      .filter(c => c.adminId === adminId)
      .map(c => ({
        id: c.studentId,
        name: c.studentName,
        unreadCount: c.messages.filter(m => !m.read && m.recipientId === adminId).length
      }));
  }, [conversations]);

  // Peer conversation support
  const getOrCreatePeerConversation = useCallback(async (
    myId: string,
    myName: string,
    peerId: string,
    peerName: string
  ) => {
    try {
      const conversationId = getConversationId(myId, peerId);

      const existing = conversations.find(c => c.id === conversationId);
      if (existing) {
        setupMessageListener(conversationId);
        return existing;
      }

      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (!convData) {
        await supabase.from('conversations').insert({
          id: conversationId,
          student_id: myId,
          student_name: myName,
          admin_id: peerId,
          admin_name: peerName,
          participants: [myId, peerId],
          last_message: '',
          last_message_time: new Date().toISOString()
        });
      }

      const conversationObj: Conversation = {
        id: conversationId,
        studentId: myId,
        studentName: myName,
        adminId: peerId,
        adminName: peerName,
        messages: [],
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
        type: 'peer',
        peerId,
        peerName,
        participants: [myId, peerId]
      };

      setConversations(prev => {
        if (prev.find(c => c.id === conversationId)) return prev;
        return [...prev, conversationObj];
      });

      setupMessageListener(conversationId);
      return conversationObj;
    } catch (error) {
      console.error('Error creating peer conversation:', error);
      return null;
    }
  }, [getConversationId, setupMessageListener, conversations]);

  // Send peer message
  const sendPeerMessage = useCallback(async (
    conversationId: string,
    senderId: string,
    senderName: string,
    recipientId: string,
    text: string
  ) => {
    try {
      setupMessageListener(conversationId);

      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: 'student',
        recipient_id: recipientId,
        text,
        timestamp: new Date().toISOString(),
        read: false
      });

      if (msgError) {
        console.error('Error inserting message:', msgError);
        return;
      }

      await supabase.from('conversations')
        .update({
          last_message: text,
          last_message_time: new Date().toISOString()
        })
        .eq('id', conversationId);

      console.log('✅ Peer message sent:', { conversationId, senderId, text });
    } catch (error) {
      console.error('Error sending peer message:', error);
    }
  }, [setupMessageListener]);

  // Load all student conversations
  const loadStudentConversations = useCallback(async (studentId: string) => {
    try {
      console.log('📱 Loading student conversations for:', studentId);
      
      // Setup a more broad channel that listens to conversations where I am a participant
      const channel = supabase
        .channel(`conversations:student:${studentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          async (payload: any) => {
              // Check if I am part of this conversation
              const conv = payload.new;
              if (conv && (conv.student_id === studentId || conv.admin_id === studentId || (conv.participants && conv.participants.includes(studentId)))) {
                console.log('🔄 Conversation update detected, refetching list...');
                
                const { data } = await supabase
                  .from('conversations')
                  .select('*')
                  .or(`student_id.eq.${studentId},admin_id.eq.${studentId},participants.cs.{${studentId}}`)
                  .order('last_message_time', { ascending: false });

                if (data) {
                  const convsWithMessages = await Promise.all(data.map(async (c) => {
                    const { data: msgData } = await supabase
                      .from('messages')
                      .select('*')
                      .eq('conversation_id', c.id)
                      .order('timestamp', { ascending: true });

                    const messages = (msgData || []).map((msg: any) => ({
                      id: msg.id,
                      senderId: msg.sender_id,
                      senderName: msg.sender_name,
                      senderRole: msg.sender_role,
                      recipientId: msg.recipient_id,
                      text: msg.text,
                      timestamp: msg.timestamp,
                      read: msg.read
                    })) as Message[];

                    setupMessageListener(c.id);
                    
                    return {
                      id: c.id,
                      studentId: c.student_id,
                      studentName: c.student_name,
                      adminId: c.admin_id,
                      adminName: c.admin_name,
                      messages,
                      lastMessage: c.last_message || '',
                      lastMessageTime: new Date(c.last_message_time || Date.now()),
                      unreadCount: messages.filter(m => !m.read && m.senderId !== studentId).length,
                      type: c.type || (c.admin_id === 'admin' ? 'admin' : 'peer'),
                      participants: c.participants || []
                    } as Conversation;
                  }));

                  setConversations(convsWithMessages);
                }
              }
            }
        )
        .subscribe();

      parentChannelRef.current = channel;

      // Initial fetch
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .or(`student_id.eq.${studentId},participants.cs.{${studentId}}`)
        .order('last_message_time', { ascending: false });

      if (data) {
        const convsWithMessages = await Promise.all(data.map(async (c) => {
          const { data: msgData } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.id)
            .order('timestamp', { ascending: true });

          const messages = (msgData || []).map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            senderRole: msg.sender_role,
            recipientId: msg.recipient_id,
            text: msg.text,
            timestamp: msg.timestamp,
            read: msg.read
          })) as Message[];

          setupMessageListener(c.id);
          
          return {
            id: c.id,
            studentId: c.student_id || studentId,
            studentName: c.student_name || 'Student',
            adminId: c.admin_id || '',
            adminName: c.admin_name || 'Admin',
            messages,
            lastMessage: c.last_message || '',
            lastMessageTime: new Date(c.last_message_time || Date.now()),
            unreadCount: messages.filter(m => !m.read && m.senderRole !== 'student').length,
            type: c.admin_id === 'admin' ? 'admin' : 'peer',
            participants: c.participants || []
          } as Conversation;
        }));

        setConversations(convsWithMessages);
      }

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error loading student conversations:', error);
      return () => {};
    }
  }, [setupMessageListener]);

  // Explicitly load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (!error && data) {
        const loadedMessages = data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderRole: msg.sender_role,
          recipientId: msg.recipient_id,
          text: msg.text,
          timestamp: msg.timestamp,
          read: msg.read
        })) as Message[];

        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? { ...conv, messages: loadedMessages }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all channels
      Object.values(channelRefs.current).forEach(channel => {
        supabase.removeChannel(channel);
      });
      if (parentChannelRef.current) {
        supabase.removeChannel(parentChannelRef.current);
      }
    };
  }, []);

  return {
    conversations,
    currentConversationId,
    setCurrentConversation,
    sendMessageAsStudent,
    sendMessageAsAdmin,
    markMessagesAsRead,
    getStudentConversation,
    getAdminConversations,
    getStudentSpecificConversation,
    getStudentsForAdmin,
    getOrCreatePeerConversation,
    sendPeerMessage,
    loadStudentConversations,
    loadMessages
  };
});
