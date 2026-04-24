import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Share } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { Job } from '@/types/job';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/theme-store';
import { formatSalary } from '@/hooks/salary-utils';
import { sanitizeText } from '@/hooks/text-utils';

interface JobCardProps {
  job: Job;
}

function JobCardInner({ job }: JobCardProps) {
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Eligible': return '#10B981';
      case 'Applied': return '#3B82F6';
      case 'Not Eligible': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDaysAgo = (date: string) => {
    if (!date) return 'Recently';
    const posted = new Date(date);
    if (isNaN(posted.getTime())) return 'Recently';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Today';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${job.title} at ${job.company}`,
        message: `🚀 Check out this opportunity!\n\n📌 ${job.title} at ${job.company}\n📍 ${job.location}\n💰 ${formatSalary(job.ctc)}\n\nApply via Ignite Placement Portal!`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push(`/job/${job.id}` as any)}
      testID={`job-card-${job.id}`}
    >
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <View style={styles.logoContainer}>
            {job.companyLogo ? (
              <Image source={{ uri: job.companyLogo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{job.company.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
            <Text style={styles.postedDate}>{getDaysAgo(job.postedDate)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.eligibilityStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(job.eligibilityStatus) }]}>
            {job.eligibilityStatus}
          </Text>
        </View>
      </View>

      <View style={styles.skillsContainer}>
        {Array.isArray(job.skills) && job.skills.slice(0, 3).map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Job type</Text>
          <Text style={styles.detailValue}>{job.jobType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Industry</Text>
          <Text style={styles.detailValue}>{job.industry}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>CTC</Text>
          <Text style={styles.detailValue}>{formatSalary(job.ctc)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{job.location}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.deadline}>
          {(() => {
            const deadline = new Date(job.registrationDeadline);
            const isValid = !isNaN(deadline.getTime());
            if (!isValid) return 'Open recruitment';
            
            const isFuture = deadline > new Date();
            const label = isFuture ? 'Apply by' : 'Closed on';
            const dateStr = deadline.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            return `${label} ${dateStr}`;
          })()}
        </Text>
        <View style={styles.footerActions}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Share2 size={16} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => router.push(`/job/${job.id}` as any)}
          >
            <Text style={styles.viewDetailsText}>View details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(JobCardInner);

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      borderRadius: isTablet ? 16 : 12,
      padding: isTablet ? 24 : 16,
      marginHorizontal: isTablet ? 24 : 16,
      marginVertical: isTablet ? 12 : 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isSmallScreen ? 'flex-start' : 'flex-start',
      marginBottom: isTablet ? 16 : 12,
    },
    companyInfo: {
      flexDirection: 'row',
      flex: isSmallScreen ? 0 : 1,
      width: isSmallScreen ? '100%' : 'auto',
      marginBottom: isSmallScreen ? 12 : 0,
    },
    logoContainer: {
      marginRight: isTablet ? 16 : 12,
    },
    logo: {
      width: isTablet ? 64 : isSmallScreen ? 40 : 48,
      height: isTablet ? 64 : isSmallScreen ? 40 : 48,
      borderRadius: isTablet ? 12 : 8,
    },
    logoPlaceholder: {
      width: isTablet ? 64 : isSmallScreen ? 40 : 48,
      height: isTablet ? 64 : isSmallScreen ? 40 : 48,
      borderRadius: isTablet ? 12 : 8,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoText: {
      color: '#FFFFFF',
      fontSize: isTablet ? 24 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: isTablet ? 24 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
      flexShrink: 1,
    },
    company: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    postedDate: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: theme.textMuted,
    },
    statusBadge: {
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 8 : 6,
      borderRadius: isTablet ? 20 : 16,
      alignSelf: isSmallScreen ? 'flex-start' : 'auto',
    },
    statusText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      fontWeight: '600',
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: isTablet ? 20 : 16,
    },
    skillTag: {
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 8 : 6,
      borderRadius: isTablet ? 20 : 16,
      marginRight: isTablet ? 12 : 8,
      marginBottom: isTablet ? 8 : 4,
    },
    skillText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: theme.text,
      fontWeight: '500',
    },
    detailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: isTablet ? 20 : 16,
    },
    detailItem: {
      width: isSmallScreen ? '100%' : '50%',
      marginBottom: isTablet ? 16 : 12,
    },
    detailLabel: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: theme.text,
      fontWeight: '500',
    },
    footer: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isSmallScreen ? 'flex-start' : 'center',
      paddingTop: isTablet ? 16 : 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    deadline: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: theme.textMuted,
      flex: isSmallScreen ? 0 : 1,
      marginBottom: isSmallScreen ? 8 : 0,
    },
    footerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    shareButton: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: theme.surfaceAlt,
    },
    viewDetailsButton: {
      marginLeft: isSmallScreen ? 0 : 4,
    },
    viewDetailsText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: theme.primary,
      fontWeight: '600',
    },
  });
}