import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  userId: string;
  type: 'job' | 'application' | 'announcement' | 'reminder' | 'message';
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  data?: Record<string, any>; // Additional context data
}

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize notifications listener for a user
  const initializeNotifications = useCallback((userId: string) => {
    try {
      // Unsubscribe from previous listener if exists
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Fetch initial notifications
      const fetchNotifications = async () => {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching notifications:', error);
            return;
          }

          const loadedNotifications = (data || []).map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type || 'announcement',
            title: n.title,
            message: n.message,
            timestamp: n.created_at,
            read: n.read || false,
            data: n.data || {}
          })) as Notification[];

          setNotifications(loadedNotifications);
          setUnreadCount(loadedNotifications.filter(n => !n.read).length);
        } catch (err) {
          console.error('Error loading notifications:', err);
        }
      };

      fetchNotifications();

      // Set up real-time listener
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          async () => {
            // Refetch on any change
            await fetchNotifications();
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      return () => {};
    }
  }, []);

  // Create a notification
  const createNotification = useCallback(async (
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          read: false,
          data: data || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all as read:', error);
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
      }

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Delete all read notifications
  const clearReadNotifications = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', true);

      if (error) {
        console.error('Error clearing notifications:', error);
      }

      // Update local state — keep only unread
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  // Triggers for automatic notifications (to be called from other parts of the app)
  
  // Trigger when a new job is posted
  const triggerNewJobNotification = useCallback(async (
    jobTitle: string,
    companyName: string,
    jobId: string
  ) => {
    try {
      // Get all student IDs and create notification for each
      const { data: students, error } = await supabase
        .from('students')
        .select('id');

      if (error) {
        console.error('Error fetching students for notification:', error);
        return;
      }

      for (const student of (students || [])) {
        await createNotification(
          student.id,
          'job',
          'New Job Opportunity',
          `${companyName} has posted a new position: ${jobTitle}`,
          { jobId, companyName }
        );
      }
    } catch (error) {
      console.error('Error triggering job notification:', error);
    }
  }, [createNotification]);

  // Trigger when application status changes
  const triggerApplicationStatusNotification = useCallback(async (
    studentId: string,
    status: string,
    jobTitle: string,
    companyName: string
  ) => {
    const statusMessages = {
      'Applied': 'Your application has been received.',
      'Under Review': 'Your application is being reviewed.',
      'Shortlisted': '🎉 You have been shortlisted!',
      'Selected': '🎊 Congratulations! You have been selected!',
      'Rejected': 'Your application has been reviewed. Thank you for applying.'
    };

    const message = statusMessages[status as keyof typeof statusMessages] || `Your application status: ${status}`;

    await createNotification(
      studentId,
      'application',
      `Application Status: ${status}`,
      `${companyName} - ${jobTitle}: ${message}`,
      { status, jobTitle, companyName }
    );
  }, [createNotification]);

  // Trigger when student receives a message
  const triggerMessageNotification = useCallback(async (
    studentId: string,
    senderName: string
  ) => {
    await createNotification(
      studentId,
      'message',
      'New Message',
      `You have a new message from ${senderName}`,
      { senderName }
    );
  }, [createNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    notifications,
    unreadCount,
    initializeNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    triggerNewJobNotification,
    triggerApplicationStatusNotification,
    triggerMessageNotification
  };
});
