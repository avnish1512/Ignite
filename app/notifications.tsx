import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Bell, Briefcase, Calendar, Users, CheckCircle, X, Settings, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useNotifications } from '@/hooks/notifications-store';
import { useTheme } from '@/hooks/theme-store';

type Notification = {
  id: string;
  type: 'job' | 'application' | 'announcement' | 'reminder' | 'message';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
};

export default function NotificationsScreen() {
  const { student } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, initializeNotifications, clearReadNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);

  // Initialize notifications when student logs in
  useEffect(() => {
    if (student?.id) {
      initializeNotifications(student.id);
    }
  }, [student?.id, initializeNotifications]);

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Notifications' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Please login to view notifications</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job': return Briefcase;
      case 'application': return CheckCircle;
      case 'announcement': return Users;
      case 'reminder': return Calendar;
      default: return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'job': return theme.primary;
      case 'application': return theme.success;
      case 'announcement': return '#F59E0B'; // Amber
      case 'reminder': return '#EF4444'; // Red
      default: return theme.textMuted;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    try {
      // Handle Firestore Timestamp object
      let date = timestamp;
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (!(timestamp instanceof Date)) {
        date = new Date(timestamp);
      }
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => markAllAsRead(student.id)} 
              style={styles.headerButton}
            >
              <Settings size={20} color={theme.primary} />
            </TouchableOpacity>
          )
        }} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity 
                onPress={() => markAllAsRead(student.id)} 
                style={styles.markAllButton}
              >
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    'Clear All Notifications',
                    'This will delete all read notifications. Unread notifications will be kept.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear',
                        style: 'destructive',
                        onPress: () => clearReadNotifications(student.id)
                      }
                    ]
                  );
                }}
                style={styles.clearButton}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.clearButtonText}>Clear read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.activeFilterTabText]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterTabText, filter === 'unread' && styles.activeFilterTabText]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread' 
                ? 'All caught up! No unread notifications.' 
                : 'You\'ll see notifications about jobs and applications here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const iconColor = getIconColor(notification.type);
              
              const handleNotificationPress = () => {
                // Mark as read
                if (!notification.read) {
                  markAsRead(notification.id);
                }
                
                // Navigate based on notification type and data
                if (notification.type === 'reminder' && notification.data?.jobId) {
                  // Navigate to job details for deadline reminders
                  router.push({
                    pathname: '/job/[id]',
                    params: { id: notification.data.jobId }
                  });
                } else if (notification.type === 'job' && notification.data?.jobId) {
                  // Navigate to job details for job postings
                  router.push({
                    pathname: '/job/[id]',
                    params: { id: notification.data.jobId }
                  });
                } else if (notification.type === 'application' && notification.data?.jobId) {
                  // Navigate to applications screen for application updates
                  router.push('/applications' as any);
                } else if (notification.type === 'message' && notification.data?.conversationId) {
                  // Navigate to messages screen with specific conversation
                  router.push({
                    pathname: '/(tab)/messages',
                    params: { conversationId: notification.data.conversationId, senderName: notification.data.senderName }
                  });
                } else if (notification.type === 'message') {
                  // Navigate to messages screen if no conversationId
                  router.push('/(tab)/messages');
                } else if (notification.data?.link) {
                  // Custom navigation link if provided
                  router.push(notification.data.link);
                }
              };
              
              return (
                <TouchableOpacity 
                  key={notification.id} 
                  style={[styles.notificationCard, !notification.read && styles.unreadCard]}
                  onPress={handleNotificationPress}
                >
                  <View style={styles.notificationContent}>
                    <View style={[styles.notificationIcon, { backgroundColor: iconColor + '20' }]}>
                      <IconComponent size={20} color={iconColor} />
                    </View>
                    
                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
                          {notification.title}
                        </Text>
                        {!notification.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                      <Text style={styles.notificationTime}>{formatTimestamp(notification.timestamp)}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(notification.id)}
                  >
                    <X size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerButton: {
      padding: 8,
    },
    header: {
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    markAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.surfaceAlt,
    },
    markAllText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '500',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    clearButton: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: '#FEE2E2', // specific red surface
      alignItems: 'center',
      gap: 6,
    },
    clearButtonText: {
      fontSize: 12,
      color: '#EF4444',
      fontWeight: '500',
    },
    filterTabs: {
      flexDirection: 'row',
      gap: 8,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.surfaceAlt,
    },
    activeFilterTab: {
      backgroundColor: theme.primary,
    },
    filterTabText: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '500',
    },
    activeFilterTabText: {
      color: '#FFFFFF',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      marginTop: 100,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
    },
    notificationsList: {
      padding: 16,
    },
    notificationCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'flex-start',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
    },
    unreadCard: {
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },
    notificationContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationText: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    unreadTitle: {
      fontWeight: 'bold',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
      marginLeft: 8,
    },
    notificationMessage: {
      fontSize: 14,
      color: theme.textMuted,
      lineHeight: 20,
      marginBottom: 8,
    },
    notificationTime: {
      fontSize: 12,
      color: theme.textMuted,
    },
    deleteButton: {
      padding: 4,
      marginLeft: 8,
    },
  });
}