import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Eye, Star, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-store';

export type ApplicationStatusType =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interviewing'
  | 'Selected'
  | 'Rejected';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<ApplicationStatusType, {
  color: string;
  bgColor: string;
  icon: any;
  label: string;
}> = {
  'Applied': {
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: Clock,
    label: 'Applied',
  },
  'Under Review': {
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: Eye,
    label: 'Under Review',
  },
  'Shortlisted': {
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: Star,
    label: 'Shortlisted',
  },
  'Interviewing': {
    color: '#6366F1',
    bgColor: '#E0E7FF',
    icon: Users,
    label: 'Interviewing',
  },
  'Selected': {
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: CheckCircle,
    label: 'Selected',
  },
  'Rejected': {
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: XCircle,
    label: 'Rejected',
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const theme = useTheme();
  const config = STATUS_CONFIG[status as ApplicationStatusType] || {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: AlertCircle,
    label: status || 'Unknown',
  };

  const IconComponent = config.icon;
  const isSmall = size === 'sm';

  // Use slightly muted bg in dark mode
  const bgColor = theme.isDark
    ? config.color + '20'
    : config.bgColor;

  return (
    <View style={[
      styles.container,
      { backgroundColor: bgColor },
      isSmall && styles.containerSm,
    ]}>
      <IconComponent
        size={isSmall ? 10 : 12}
        color={config.color}
      />
      <Text style={[
        styles.text,
        { color: config.color },
        isSmall && styles.textSm,
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

/** Returns the status color for external use */
export function getStatusColor(status: string): string {
  const config = STATUS_CONFIG[status as ApplicationStatusType];
  return config?.color || '#6B7280';
}

/** Returns the status icon component for external use */
export function getStatusIcon(status: string) {
  const config = STATUS_CONFIG[status as ApplicationStatusType];
  return config?.icon || AlertCircle;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
});
